const UserDTO = require("../../../dtos/user");
const ApiError = require("../../../exceptions/api-error");
const UserService = require("../services/users");
const { FUNCTIONS } = require("../../../utils/functions");
const bcrypt = require("bcryptjs");
const { CONSTANTS } = require("../../../config/constants");
const { Op } = require("sequelize");
const { default: captchapng } = require("typed-captchapng");
const { OAuth2Client } = require("google-auth-library");
const db = require("../../../models");
const USER_CONSTANTS = require("../utils/constants");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UserController {
  // ─── Auth ────────────────────────────────────────────────────────────────────

  static async captcha(req, res, next) {
    try {
      const number = Math.floor(Math.random() * 9000 + 1000);
      const png = new captchapng(80, 30, number);
      req.session.cookie.maxAge = 5 * 60 * 1000;
      req.session.captcha = number.toString();
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(png.getBuffer());
    } catch (e) {
      next(e);
    }
  }

  // ─── Self-service profile ────────────────────────────────────────────────────

  static async getMe(req, res, next) {
    try {
      const user = await db.User.findOne({
        where: { id: req.user.id },
        attributes: { exclude: ['password'] },
      });
      if (!user) throw ApiError.NotFound();
      return res.status(200).json({ model: user });
    } catch (e) {
      next(e);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const user = await db.User.findOne({ where: { id: req.user.id } });
      if (!user) throw ApiError.NotFound();

      const { name, surname, email, phone_number, birth_date } = req.body;

      if (email && email !== user.email) {
        const existing = await db.User.findOne({ where: { email } });
        if (existing) throw ApiError.BadRequest('Email is already in use');
      }
      if (phone_number && phone_number !== user.phone_number) {
        const existing = await db.User.findOne({ where: { phone_number } });
        if (existing) throw ApiError.BadRequest('Phone number is already in use');
      }

      if (name !== undefined) user.name = FUNCTIONS.safeString(name);
      if (surname !== undefined) user.surname = FUNCTIONS.safeString(surname);
      if (email !== undefined) user.email = email || null;
      if (phone_number !== undefined) user.phone_number = phone_number || null;
      if (birth_date !== undefined) user.birth_date = birth_date || null;

      await user.save();
      const { password: _pw, ...safe } = user.toJSON();
      return res.status(200).json({ model: safe });
    } catch (e) {
      next(e);
    }
  }

  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file) throw ApiError.BadRequest("No file uploaded");
      const user = await db.User.findOne({ where: { id: req.user.id } });
      if (!user) throw ApiError.NotFound();
      user.thumbnail = `/static/avatars/${req.file.filename}`;
      await user.save();
      return res.status(200).json({ thumbnail: user.thumbnail });
    } catch (e) {
      next(e);
    }
  }

  static async disconnectGoogle(req, res, next) {
    try {
      const user = await db.User.findOne({
        where: { id: req.user.id },
        attributes: ['id', 'google_id', 'password'],
      });
      if (!user) throw ApiError.NotFound();
      if (!user.password) throw ApiError.BadRequest('Set a password before disconnecting Google');
      user.google_id = null;
      await user.save();
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  static async forceLogin(req, res, next) {
    this.loginFunction(req, res, next, true);
  }

  static async login(req, res, next) {
    this.loginFunction(req, res, next);
  }

  /**
   * POST /auth/google
   * Body: { id_token }  — the credential returned by Google Identity Services
   */
  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;
      if (!id_token) throw ApiError.BadRequest("id_token is required");

      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      const { user } = await UserService.findOrCreateByGoogle({
        google_id: payload.sub,
        email: payload.email,
        given_name: payload.given_name,
        family_name: payload.family_name,
      });

      return this._issueTokenResponse(req, res, user, null);
    } catch (e) {
      next(e);
    }
  }

  static async loginFunction(req, res, next, isForce = false) {
    try {
      const phone_number = FUNCTIONS.safeString(req.body?.phone_number);
      const password = FUNCTIONS.safeString(req.body?.password);

      if (!phone_number || (!password && !isForce))
        throw ApiError.BadRequest("Missing required parameters");

      const user = await UserService.getByPhone(phone_number);
      if (!user) throw ApiError.BadRequest("Invalid phone_number or password");

      if (!isForce && !(await bcrypt.compare(req.body.password, user.password))) {
        await db.UserLoginFail.create({ user_id: user.id });

        const fails = await db.UserLoginFail.count({
          where: { user_id: { [Op.eq]: user.id } },
        });

        if (fails >= USER_CONSTANTS.MAX_LOGIN_FAIL_ATTEMTS) {
          await db.UserLoginFail.destroy({ where: { user_id: { [Op.eq]: user.id } } });
          const blocked_till = new Date();
          blocked_till.setMinutes(
            blocked_till.getMinutes() + USER_CONSTANTS.USER_LOGIN_BLOCK_DURATION
          );
          user.blocked_till = blocked_till;
          await user.save();
        }

        throw ApiError.BadRequest("Invalid phone_number or password");
      }

      // ── 2FA: issue OTP session instead of tokens ─────────────────────────────
      if (!isForce && req.config?.is_otp_enabled) {
        const sessionId = await UserService.createOtpSession(user.id);
        return res.status(200).json({ is2FA: true, session_id: sessionId });
      }

      return this._issueTokenResponse(req, res, user, null);
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /verify-otp
   * Body: { session_id, otp }
   * Completes 2FA login: validates the OTP and returns tokens.
   */
  static async verifyOtp(req, res, next) {
    try {
      const { session_id, otp } = req.body;
      if (!session_id || !otp) throw ApiError.BadRequest("session_id and otp are required");

      const { userId, purpose } = await UserService.validateOtpSession(session_id, otp);
      if (!userId) throw ApiError.BadRequest("Invalid or expired OTP");

      if (purpose === USER_CONSTANTS.OTP_PURPOSES.REGISTER) {
        await UserService.activateUser(userId);
      }

      const user = await UserService.getById(userId);
      if (!user) throw ApiError.NotFound("User not found");

      return this._issueTokenResponse(req, res, user, null);
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /resend-otp
   * Body: { session_id }
   * Generates a fresh OTP for an existing pending session.
   */
  static async resendOtp(req, res, next) {
    try {
      const { session_id } = req.body;
      if (!session_id) throw ApiError.BadRequest("session_id is required");
      await UserService.refreshOtpSession(session_id);
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /register
   * Body: { name, surname, email, phone_number, password, birth_date? }
   * Creates an inactive user account; email verification / admin approval follows.
   */
  static async register(req, res, next) {
    try {
      const { name, surname, phone_number, password, email, birth_date } = req.body;

      if (!name || !phone_number || !password)
        throw ApiError.BadRequest("name, phone_number and password are required");

      if (password.length < 8)
        throw ApiError.BadRequest("Password must be at least 8 characters");

      const existingPhone = await UserService.getByPhone(phone_number);
      if (existingPhone)
        throw ApiError.BadRequest("An account with this phone number already exists");

      if (email) {
        const existingEmail = await UserService.getByEmail(email);
        if (existingEmail)
          throw ApiError.BadRequest("An account with this email already exists");
      }

      const model = await UserService.register({
        name: FUNCTIONS.safeString(name),
        surname: FUNCTIONS.safeString(surname),
        phone_number: FUNCTIONS.safeString(phone_number),
        email: email ? FUNCTIONS.safeString(email) : null,
        password,
        birth_date: birth_date ?? null,
      });

      const sessionId = await UserService.createOtpSession(
        model.id,
        USER_CONSTANTS.OTP_PURPOSES.REGISTER
      );

      return res.status(201).json({ session_id: sessionId });
    } catch (e) {
      next(e);
    }
  }

  static async selectAssignment(req, res, next) {
    try {
      const assignmentId = req.body?.assignment_id;
      if (!assignmentId) throw ApiError.BadRequest("assignment_id is required");

      const assignment = await db.UserPositionAssignment.findOne({
        where: { id: assignmentId, user_id: req.user.id, is_active: true },
        include: [
          {
            model: db.UserPosition,
            as: "position",
            include: [
              {
                model: db.Role,
                as: "role",
                attributes: { exclude: ["createdBy", "created_at", "updated_at", "deleted_at"] },
              },
              { model: db.Department, as: "_department", attributes: ["name"] },
            ],
          },
        ],
      });

      if (!assignment) throw ApiError.Forbidden("Invalid assignment");

      const user = await UserService.getById(req.user.id);
      const userDTO = new UserDTO(user, assignment);
      const [accessToken, refreshToken] = UserService.getTokens({ ...userDTO });

      await db.UserSession.update(
        { refresh_token: refreshToken, assignment_id: assignmentId },
        { where: { refresh_token: req.cookies.refreshToken } }
      );

      res.cookie("refreshToken", refreshToken, {
        maxAge: process.env.REFRESH_TOKEN_EXPIRE_TIME_MILLISECONDS,
        httpOnly: true,
      });

      return res.status(200).json({ token: accessToken, user: userDTO });
    } catch (e) {
      next(e);
    }
  }

  static async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) await UserService.logoutByToken(refreshToken);
      res.clearCookie("refreshToken");
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const deviceInfo = req.headers["user-agent"]?.substring(0, 255);
      const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const { accessToken, newRefreshToken, user } = await UserService.refresh(refreshToken, {
        ipAddress,
        deviceInfo,
      });

      res.cookie("refreshToken", newRefreshToken, {
        maxAge: process.env.REFRESH_TOKEN_EXPIRE_TIME_MILLISECONDS,
        httpOnly: true,
      });

      return res.status(200).json({ token: accessToken, user });
    } catch (e) {
      next(e);
    }
  }

  static async updatePassword(req, res, next) {
    try {
      const model = await db.User.findOne({
        where: { id: req.user.id },
        attributes: ["id", "password"],
      });
      if (!model) throw ApiError.NotFound();
      if (
        !req.body.old_password ||
        !(await bcrypt.compare(req.body.old_password, model.password))
      )
        throw ApiError.BadRequest("Current password is incorrect");

      if (req.body?.password)
        model.password = await FUNCTIONS.getHashedPassword(req.body.password);

      await model.save();
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  // ─── Users (admin) ───────────────────────────────────────────────────────────

  static async get(req, res, next) {
    try {
      const paranoid = !req.query?.paranoid;
      const { limit, sort, skip } = FUNCTIONS.getQueryParams(req);
      const filter = await this.getFilter(req.query);
      const data = await UserService.get(filter, limit, sort, skip, paranoid);
      const count = await UserService.getCount(filter, paranoid);

      return res.status(200).json({ data, count });
    } catch (e) {
      next(e);
    }
  }

  static async getById(req, res, next) {
    try {
      const paranoid = !req.query?.paranoid;
      const model = await UserService.getById(req.params?.id, paranoid);
      return res.status(200).json({ model });
    } catch (e) {
      next(e);
    }
  }

  static async create(req, res, next) {
    try {
      const { isError, errors } = await this.validate(req.body);
      if (isError) throw ApiError.BadRequest(undefined, errors);
      const model = await UserService.create(req);
      return res.status(201).json({ model });
    } catch (e) {
      next(e);
    }
  }

  static async update(req, res, next) {
    try {
      const model = await UserService.getById(req.params?.id);
      if (!model) throw ApiError.NotFound();

      model.name = req.body?.name;
      model.surname = req.body?.surname;
      model.phone_number = req.body?.phone_number;
      model.email = req.body?.email;
      model.birth_date = req.body?.birth_date;
      model.status = req.body?.status;
      model.role = req.body?.role ?? null;

      if (req.body?.password)
        model.password = await FUNCTIONS.getHashedPassword(req.body.password);

      const { isError, errors } = await this.validate(model, true);
      if (isError) throw ApiError.BadRequest(undefined, errors);

      await model.save();
      return res.status(200).json({ model });
    } catch (e) {
      next(e);
    }
  }

  static async unlockUser(req, res, next) {
    try {
      const model = await UserService.getById(req.params?.id);
      if (!model) throw ApiError.NotFound();
      model.blocked_till = null;
      await model.save();
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  static async delete(req, res, next) {
    try {
      await UserService.deleteById(req.params?.id);
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  static async forceDelete(req, res, next) {
    try {
      await UserService.deleteById(req.params.id, true);
      return res.sendStatus(200);
    } catch (e) {
      next(e);
    }
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  static async getSessions(req, res, next) {
    try {
      const data = await db.UserSession.findAll({
        where: { user_id: req.user.id },
        attributes: ["id", "device_info", "ip", "last_used", "createdAt"],
        order: [["last_used", "DESC"]],
      });
      return res.status(200).json({ data });
    } catch (e) {
      next(e);
    }
  }

  static async deleteSession(req, res, next) {
    try {
      await db.UserSession.destroy({
        where: { id: req.params.id, user_id: req.user.id },
      });
      return res.status(200).json({ success: true });
    } catch (e) {
      next(e);
    }
  }

  // ─── Utils ───────────────────────────────────────────────────────────────────

  /** Shared helper: finalize login and emit tokens. */
  static async _issueTokenResponse(req, res, user, assignment) {
    const resolvedAssignment = assignment ?? user.position_assignments?.[0] ?? null;
    const userDTO = new UserDTO(user, resolvedAssignment);
    const [accessToken, refreshToken] = UserService.getTokens({ ...userDTO });

    const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const deviceInfo = req.headers["user-agent"]?.substring(0, 255);

    user.last_login_date = new Date();
    user.last_login_ip = ipAddress;
    await user.save();

    await db.UserLoginFail.destroy({ where: { user_id: { [Op.eq]: user.id } } });
    await UserService.saveToken(user.id, refreshToken, ipAddress, deviceInfo, resolvedAssignment?.id ?? null);
    await this.saveLoginModel(ipAddress, user.id, deviceInfo);

    res.cookie("refreshToken", refreshToken, {
      maxAge: process.env.REFRESH_TOKEN_EXPIRE_TIME_MILLISECONDS,
      httpOnly: true,
    });

    return res.status(200).json({ token: accessToken, user: userDTO, is2FA: false });
  }

  static async getFilter(params) {
    const { text, role, status, statuses, roles, phone_number, paranoid } = params || {};
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (statuses) filter.status = { [Op.in]: statuses };
    if (roles) filter.role = { [Op.in]: roles };
    if (phone_number) filter.phone_number = { [Op.eq]: phone_number };
    if (text) {
      filter[Op.or] = [
        { name: { [Op.iLike]: `%${text}%` } },
        { surname: { [Op.iLike]: `%${text}%` } },
        { email: { [Op.iLike]: `%${text}%` } },
      ];
    }
    if (paranoid) filter.deletedAt = { [Op.ne]: null };

    return filter;
  }

  static async validate(form, isUpdate = false) {
    const errors = {};

    if (!FUNCTIONS.checkRequire(form?.name)) {
      errors.name = "Name is required";
    } else if (form.name.length > 100) {
      errors.name = "Name must be at most 100 characters";
    }

    if (!FUNCTIONS.checkRequire(form?.surname)) {
      errors.surname = "Surname is required";
    } else if (form.surname.length > 100) {
      errors.surname = "Surname must be at most 100 characters";
    }

    if (!FUNCTIONS.checkRequire(form?.phone_number)) {
      errors.phone_number = "Phone number is required";
    } else if (!FUNCTIONS.checkPhone(form?.phone_number)) {
      errors.phone_number = "Invalid phone number format";
    }

    if (!isUpdate && !FUNCTIONS.checkRequire(form?.password)) {
      errors.password = "Password is required";
    } else if (!isUpdate && form?.password?.length > 100) {
      errors.password = "Password must be at most 100 characters";
    }

    if (form?.status === null || form?.status === undefined) {
      errors.status = "Status is required";
    }

    return {
      isError: Object.keys(errors).length > 0,
      errors,
    };
  }

  static async confirmUserByPassword(id, password) {
    const model = await db.User.findOne({ where: { id }, attributes: ["id", "password"] });
    if (!id || !password || !model) return false;
    return bcrypt.compare(password, model.password);
  }

  static async saveLoginModel(ip, user_id, device_info) {
    if (user_id) return db.UserLogin.create({ ip, user_id, device_info });
  }
}

module.exports = UserController;