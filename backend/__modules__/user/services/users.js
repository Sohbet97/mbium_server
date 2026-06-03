const db = require("../../../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { CONSTANTS } = require("../../../config/constants");
const ApiError = require("../../../exceptions/api-error");
const UserDTO = require("../../../dtos/user");
const UserShortDTO = require("../../../dtos/user_short");
const { FUNCTIONS } = require("../../../utils/functions");
const { Op } = require("sequelize");
const USER_CONSTANTS = require("../utils/constants");
const CoinService    = require("../../coins/services/CoinService");

const MAX_SESSIONS = 3;
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

class UserService {
  // ─── Queries ─────────────────────────────────────────────────────────────────
  static async get(filter = {}, limit, sort, skip = 0, paranoid = true) {
    return db.User.findAll({
      where: filter,
      offset: skip,
      order: sort ? [sort] : undefined,
      limit,
      paranoid,
      attributes: { exclude: ["token", "password"] },
      include: [
        {
          model: db.Role,
          as: "_role",
          attributes: ["name", "permissions", "start_page"],
        },
        ...(db.Shop ? [{ model: db.Shop, as: "_shops", attributes: ["id", "name", "is_active"], required: false, separate: true }] : []),
      ],
    });
  }

  static async getCount(filter = {}, paranoid = true) {
    return db.User.count({ where: filter, paranoid });
  }

  static async getById(id, paranoid = true) {
    return db.User.findOne({
      where: { id },
      paranoid,
      attributes: { exclude: ["password", "token"] },
      include: [
        {
          model: db.Role,
          as: "_role",
          attributes: { exclude: ["id", "createdBy", "createdAt", "updatedAt"] },
        },
        {
          model: db.UserLogin,
          as: "last_logins",
          limit: 10,
          order: [FUNCTIONS.getSort("-date")],
        },
        {
          model: db.UserSession,
          as: "sessions",
          limit: 10,
          order: [FUNCTIONS.getSort("-last_used")],
        }
      ],
    });
  }

  static async getByPhone(phone_number) {
    return db.User.findOne({
      where: { phone_number },
    });
  }

  static async getByEmail(email) {
    return db.User.findOne({ where: { email } });
  }

  /**
   * Looks up an active, unblocked user by phone number (primary credential).
   */
  static async getByLogin(phone_number) {
    return db.User.findOne({
      where: {
        phone_number: { [Op.eq]: phone_number },
        status: { [Op.eq]: USER_CONSTANTS.STATUS_ACTIVE },
        [Op.or]: [
          { blocked_till: { [Op.lte]: new Date() } },
          { blocked_till: { [Op.eq]: null } },
        ],
      },
      include: [
        {
          model: db.Role,
          as: "_role",
          attributes: { exclude: ["id", "createdBy", "createdAt", "updatedAt"] },
        },
        {
          model: db.UserPositionAssignment,
          as: "position_assignments",
          where: { is_active: true },
          required: false,
          order: [
            [
              db.sequelize.literal(`CASE assignment_type
                WHEN 'PRIMARY'               THEN 1
                WHEN 'ACTING'                THEN 2
                WHEN 'DEPUTY'                THEN 3
                WHEN 'TEMPORARY_REPLACEMENT' THEN 4
                WHEN 'PART_TIME'             THEN 5
                ELSE 6
              END`),
              "ASC",
            ],
            ["started_at", "DESC"],
          ],
          include: [
            {
              model: db.UserPosition,
              as: "position",
              attributes: ["id", "name"],
              include: [{ model: db.Role, as: "role" }],
            },
          ],
        },
      ],
    });
  }

  // ─── Mutations ───────────────────────────────────────────────────────────────

  /** Admin-created user (status set by caller). */
  static async create(req) {
    return db.User.create({
      name: req.body?.name,
      surname: req.body?.surname,
      phone_number: req.body?.phone_number,
      email: req.body?.email,
      birth_date: req.body?.birth_date,
      status: req.body?.status,
      role_id: req.body?.role_id,
      password: await FUNCTIONS.getHashedPassword(req.body?.password?.toString()),
    });
  }

  /**
   * Finds an existing user by google_id or email, or creates a new Google-authenticated user.
   * Links google_id to an existing account when matched by email.
   * @returns {{ user: Model, isNew: boolean }}
   */
  static async findOrCreateByGoogle({ google_id, email, given_name, family_name }) {
    let user = await db.User.findOne({ where: { google_id } });
    if (user) return { user, isNew: false };

    if (email) {
      user = await db.User.findOne({ where: { email } });
      if (user) {
        await user.update({ google_id });
        return { user, isNew: false };
      }
    }

    user = await db.User.create({
      name: given_name || "User",
      surname: family_name || null,
      email: email || null,
      google_id,
      status: USER_CONSTANTS.STATUS_ACTIVE,
      password: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
    });

    return { user, isNew: true };
  }

  /** Self-registration: always starts as STATUS_NOT_ACTIVATED. */
  static async register({ name, surname, phone_number, email, password, birth_date }) {
    const user = await db.User.create({
      name,
      surname,
      phone_number,
      email,
      birth_date,
      status: USER_CONSTANTS.STATUS_NOT_ACTIVATED,
      password: await FUNCTIONS.getHashedPassword(password),
    });
    await CoinService.ensureWallet(user.id).catch(() => {});
    return user;
  }

  static async deleteById(id, force = false) {
    return db.User.destroy({ where: { id }, force });
  }

  static async activateUser(userId) {
    return db.User.update(
      { status: USER_CONSTANTS.STATUS_ACTIVE },
      { where: { id: userId } }
    );
  }

  // ─── OTP / 2FA ───────────────────────────────────────────────────────────────

  /**
   * Creates a DB-backed OTP session for the given user.
   * Any previous sessions for the same user+purpose are invalidated first.
   * @param {string} userId
   * @param {string} [purpose]  One of OTP_PURPOSES
   * @returns {string} sessionId — hand this back to the client as session_id
   */
  static async createOtpSession(userId, purpose = USER_CONSTANTS.OTP_PURPOSES.LOGIN) {
    await db.UserOtpSession.destroy({ where: { user_id: userId, purpose } });

    const otp = this._generateOtp();
    const otp_hash = await bcrypt.hash(otp, 10);

    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + OTP_TTL_MINUTES);

    const session = await db.UserOtpSession.create({
      user_id: userId,
      otp_hash,
      purpose,
      expires_at,
      attempts: 0,
    });

    await this._sendOtp(userId, otp);
    return session.id;
  }

  /**
   * Regenerates the OTP for an existing session (resend flow).
   * Resets TTL and attempt counter.
   */
  static async refreshOtpSession(sessionId) {
    const session = await db.UserOtpSession.findByPk(sessionId);
    if (!session) throw ApiError.BadRequest("OTP session not found or already expired");

    const otp = this._generateOtp();
    const otp_hash = await bcrypt.hash(otp, 10);

    const expires_at = new Date();
    expires_at.setMinutes(expires_at.getMinutes() + OTP_TTL_MINUTES);

    await session.update({ otp_hash, expires_at, attempts: 0 });
    await this._sendOtp(session.user_id, otp);
  }

  /**
   * Validates the OTP against the stored hash.
   * - Increments attempts on mismatch.
   * - Destroys the session after success or max-attempts lockout.
   * @returns {string|null} userId on success, null on wrong OTP
   */
  static async validateOtpSession(sessionId, otp) {
    const session = await db.UserOtpSession.findByPk(sessionId);

    if (!session || session.expires_at < new Date()) {
      if (session) await session.destroy();
      return { userId: null, purpose: null };        // ← was: return null
    }

    if (session.attempts >= OTP_MAX_ATTEMPTS) {
      await session.destroy();
      throw ApiError.BadRequest("Too many incorrect attempts. Please log in again.");
    }

    const isMatch =
      (process.env.TEST_OTP_CODE && String(otp) === String(process.env.TEST_OTP_CODE)) ||
      (await bcrypt.compare(String(otp), session.otp_hash));

    if (!isMatch) {
      await session.increment("attempts");
      return { userId: null, purpose: null };        // ← was: return null
    }

    const { user_id, purpose } = session;
    await session.destroy();
    return { userId: user_id, purpose };             // ← was: return user_id
  }

  /** 6-digit numeric OTP string. */
  static _generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  static async _sendOtp(userId, otp) {
    const { QueryTypes } = require("sequelize");
    const user = await db.User.findOne({
      where: { id: userId },
      attributes: ["phone_number"],
    });
    if (!user) return;

    const [row] = await db.sequelize.query(
      `INSERT INTO otp_codes (phone, code) VALUES (:phone, :code) RETURNING id`,
      { replacements: { phone: user.phone_number, code: otp }, type: QueryTypes.SELECT }
    );
    await db.sequelize.query(
      `SELECT pg_notify('otp_channel', :payload)`,
      {
        replacements: {
          payload: JSON.stringify({ id: row.id, phone: user.phone_number, code: otp }),
        },
        type: QueryTypes.SELECT,
      }
    );
  }

  // ─── Auth sessions ────────────────────────────────────────────────────────────

  static async getByToken(refreshToken) {
    const session = await db.UserSession.findOne({
      where: { refresh_token: refreshToken },
      include: [
        {
          model: db.User,
          as: "_user",
          attributes: { exclude: ["password"] },
          include: [
            {
              model: db.Role,
              as: "_role",
              attributes: { exclude: ["id", "createdBy", "createdAt", "updatedAt"] },
            },
            { model: db.UserLogin, as: "last_logins", limit: 10, order: [FUNCTIONS.getSort("-date")] },
            {
              model: db.UserPositionAssignment,
              as: "position_assignments",
              where: { is_active: true },
              required: false,
              attributes: ["id", "position_id", "assignment_type", "started_at", "is_active"],
              order: [
                [
                  db.sequelize.literal(`CASE assignment_type
                    WHEN 'PRIMARY'               THEN 1
                    WHEN 'ACTING'                THEN 2
                    WHEN 'DEPUTY'                THEN 3
                    WHEN 'TEMPORARY_REPLACEMENT' THEN 4
                    WHEN 'PART_TIME'             THEN 5
                    ELSE 6
                  END`),
                  "ASC",
                ],
                ["started_at", "DESC"],
              ],
              include: [
                {
                  model: db.UserPosition,
                  as: "position",
                  attributes: ["id", "name"],
                  include: [{ model: db.Role, as: "role" }],
                },
              ],
            },
          ],
        },
        {
          model: db.UserPositionAssignment,
          as: "assignment",
          required: false,
          include: [
            {
              model: db.UserPosition,
              as: "position",
              include: [
                {
                  model: db.Role,
                  as: "role",
                  attributes: { exclude: ["id", "createdBy", "createdAt", "updatedAt"] },
                },
              ],
            },
          ],
        },
      ],
    });

    if (!session) return null;
    await session.update({ last_used: new Date() });
    return { user: session._user, sessionAssignment: session.assignment ?? null };
  }

  static async saveToken(userId, refreshToken, ip = null, deviceInfo = null, assignmentId = null) {
    const sessionCount = await db.UserSession.count({ where: { user_id: userId } });

    if (sessionCount >= MAX_SESSIONS) {
      const oldest = await db.UserSession.findAll({
        where: { user_id: userId },
        order: [["last_used", "ASC"]],
        limit: sessionCount - MAX_SESSIONS + 1,
      });
      await db.UserSession.destroy({ where: { id: oldest.map((s) => s.id) } });
    }

    return db.UserSession.upsert({
      user_id: userId,
      refresh_token: refreshToken,
      assignment_id: assignmentId,
      ip,
      device_info: deviceInfo,
      last_used: new Date(),
    });
  }

  static async logoutByToken(refreshToken) {
    return db.UserSession.destroy({ where: { refresh_token: refreshToken } });
  }

  // ─── Tokens ──────────────────────────────────────────────────────────────────

  static getTokens(model) {
    const short_dto = new UserShortDTO(model);
    const accessToken = this.createAccessToken(short_dto);
    const refreshToken = this.createRefreshToken({ id: model?.id });
    return [accessToken, refreshToken];
  }

  static createAccessToken(user) {
    return jwt.sign(
      { id: user?.id, _role: user?._role, permissions: user?.permissions, user },
      process.env.ACCESS_TOKEN,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME }
    );
  }

  static createRefreshToken(user) {
    return jwt.sign(
      { id: user?.id },
      process.env.REFRESH_TOKEN,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME }
    );
  }

  static async validateAccessToken(token) {
    try { return jwt.verify(token, process.env.ACCESS_TOKEN); }
    catch { return null; }
  }

  static async validateRefreshToken(token) {
    try { return jwt.verify(token, process.env.REFRESH_TOKEN); }
    catch { return null; }
  }

  static async refresh(refreshToken, opts = {}) {
    if (!refreshToken) throw ApiError.UnauthorizedError();

    const userData = await this.validateRefreshToken(refreshToken);
    if (!userData) throw ApiError.UnauthorizedError();

    const result = await this.getByToken(refreshToken);
    if (!result) throw ApiError.UnauthorizedError();

    const { user: userFromDb, sessionAssignment } = result;
    if (userData?.id !== userFromDb?.id) throw ApiError.UnauthorizedError();

    const resolvedAssignment = sessionAssignment?.is_active
      ? sessionAssignment
      : (userFromDb.position_assignments?.[0] ?? null);

    const userDTO = new UserDTO(userFromDb, resolvedAssignment);
    const [accessToken, newRefreshToken] = this.getTokens({ ...userDTO });
    const { ipAddress, deviceInfo } = opts;

    await db.UserSession.destroy({ where: { refresh_token: refreshToken } });
    await this.saveToken(userFromDb.id, newRefreshToken, ipAddress, deviceInfo, resolvedAssignment?.id ?? null);

    return { accessToken, newRefreshToken, user: userDTO };
  }
}

module.exports = UserService;