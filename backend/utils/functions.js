const { CONSTANTS } = require("../config/constants");
const { readFile } = require('fs');
const fs = require('fs');
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class FUNCTIONS {
    // Middleware for routes handling all unhandled errors
    /**
     *
     * @param {object} res
     * @param {function} callback
     * @returns Promise
     */
    static async safeWrapper(res, callback) {
        try {
            callback();
        } catch (err) {
            console.log(err);
            res.status(500).json({
                message: "Sorry there server side error!"
            });
        }
    }

    static getNumber(val) {
        const number = Number(val)
        return isNaN(number) ? null : number
    }

    static getString(str) {
        if (str === null || str === undefined) return "";
        return (str + '')
    }

    static normalizeString(str) {
        return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }



    static convertUtf8ToIso885915(str) {
        const latin_map = {
            'ş': 'sh',
            'ň': 'n',
            'ž': 'zh',
            'Ş': 'Sh',
            'Ň': 'N',
            'Ž': 'Zh',
        }
        return str.replace(/[žňşŞŇŽ]/g, match => latin_map[match])
    }

    static getFullname(model, isSecondName = false) {
        if (model?.isAnonim) {
            return 'Näbelli'
        } else {
            const label = `${this.firstLetterUpperCase(this.getString(model?.surname))} ${this.firstLetterUpperCase(this.getString(model?.name))}` + (isSecondName ? ` ${this.firstLetterUpperCase(this.getString(model?.second_name))}` : '')
            return String(label).trim() || `#${model?.id || ''}`
        }
    }



    static getNameForSignature(model) {
        const secondNameLetter = this.firstLetterUpperCase(this.getString(model?.second_name).substring(0, 1))
        const label = `${this.firstLetterUpperCase(this.getString(model?.surname))} ${this.firstLetterUpperCase(this.getString(model?.name).substring(0, 1))}${secondNameLetter ? '.' : ''}${secondNameLetter}`
        return String(label).trim()
    }


    static getUserNameWithPosition(model) {
        const position = model?._position?.name || ''
        const name = this.getNameForSignature(model)
        return `${position || ''} ${name || ''}`.trim()
    }


    static firstLetterUpperCase(str) {
        if ((typeof str) == 'string') {
            str = `${str.substr(0, 1).toLocaleUpperCase()}${str.substr(1)}`
        }
        return str;
    }


    // Returns sort object for sequelize queries
    static getSort(sort) {
        let _sort = {};
        if (sort?.at(0) == "-") {
            _sort = [sort.substr(1), "DESC"];
        } else if (sort == undefined) {
            {
                _sort = ['createdAt', "DESC"];
            }
        } else {
            _sort = [sort, "ASC"];
        }
        return _sort;
    }

    // Returns limit for sequelize queries
    static getLimit(req) {
        let limit = 20;
        if (req.query?.limit) {
            req.query?.limit > 0 ?
                limit = req.query.limit
                :
                limit = undefined;
        }
        return limit;
    }

    static getQueryParams(req, defaultSort = '-createdAt') {
        const limit = this.getLimit(req);
        const sort = [this.getSort(req.query?.sort || defaultSort)];
        const page = req?.query?.page || 1;
        const skip = (page - 1) * limit || 0;
        return { limit, sort, skip, page };
    }

    // Returns unique patient identificator
    static async createPatientId(lastIndex) {
        return `${CONSTANTS.PATIENT_CODE}${lastIndex}`;
    }

    // Returns unique identificator
    static createId(length = 2) {
        return `${CONSTANTS.HOSPITAL_CODE}${this.createRandomStr(length)}${new Date().getTime().toString(32)}`;
    }

    // Returns unique identificator
    static createModelId(appendix, length = 2) {
        return `${CONSTANTS.HOSPITAL_CODE}-${appendix}-${this.createRandomStr(length)}-${new Date().getTime().toString(32)}`;
    }

    // Create random string
    static createRandomStr(length = 10) {
        const raw = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
        let rndStr = "";
        for (let i = 0; i < length; i++) {
            rndStr += raw.at(Math.round((raw.length - 1) * Math.random()))
        }
        return rndStr;
    }

    // Returns true if value setted
    static checkRequire(value) {
        return value && (value + "").trim();
    }

    // Check phone number correct
    static checkPhone(phone) {
        phone = parseInt(phone);
        phone *= 1;
        return (!isNaN(phone) && phone >= 61000000 && phone <= 99999999);
    }

    static checkOnlyTmLetters(value) {
        return (/^(?:(?![CcVvXxQq])[A-Za-zÝýÜüÄäŞşÖöŇňŽžÇç\s\-])+$/).test(value);
    }

    static checkOnlyLetters(value) {
        return (/^[A-Za-zÝýÜüÄäŞşÖöŇňŽžÇç\s\-]+$/).test(value);
    }

    // Check value for the containing only digits
    static checkOnlyDigit(value) {
        return (/^[0-9]+$/).test(value);
    }

    static getConfigJson(res, callback) {
        return readFile('./utils/config.json', (err, data) => {
            if (err) {
                console.log(err);
                res.sendStatus(500)
            } else {
                callback(JSON.parse(data.toString()));
            }
        });
    }

    static addZero(number) {
        if (number < 10) {
            return "0" + number;
        } else {
            return number;
        }
    }

    static convertTZ(date, tzString) {
        return new Date((typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', { timeZone: tzString }))
    }

    static convertTMZ(date) {
        return this.convertTZ(date, 'Asia/Ashgabat')
    }

    static getFilterDate(dateStr, isTime = false) {
        const date = new Date(dateStr)
        const day = this.addZero(date.getDate())
        const month = this.addZero(date.getMonth() + 1)
        const year = date.getFullYear()
        const hours = this.addZero(date.getHours())
        const minutes = this.addZero(date.getMinutes())
        return `${year}-${month}-${day}` + (isTime ? `T${hours}:${minutes}` : '')
    }

    static getHourAndMinute(date) {
        if (date instanceof Date) {
            const hour = date.getHours();     // Gets the hour (0-23)
            const minute = date.getMinutes(); // Gets the minute (0-59)
            return `${this.addZero(hour)}:${this.addZero(minute)}`; ы
        }
        return;
    }

    static getFormattedDate(dateStr, delimeter = '/', isTime = false, isYear = true) {
        if (!dateStr) return '';

        let date;

        if (typeof dateStr === 'string' && dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        if (isTime) {
            date = new Date(this.convertTMZ(dateStr));
        } else {
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) return '';

        const day = this.addZero(date.getDate());
        const month = this.addZero(date.getMonth() + 1);
        const year = date.getFullYear();

        let appendix = '';
        if (isTime) {
            appendix = ` ${this.addZero(date.getHours())}:${this.addZero(date.getMinutes())}`;
        }

        return `${day}${delimeter}${month}${isYear ? delimeter + year : ''}${appendix}`;
    }

    static safeString(str) {
        if (['string', 'number'].includes(typeof str)) {
            str += '';
        }
        return str;
    }

    // Delete specific path
    static async deletePath(path) {
        fs.existsSync(path) ? unlinkAsync(path) : null;
    }

    static async move(oldPath, newPath, callback) {
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                if (err.code === 'EXDEV') {
                    copy();
                } else {
                    callback(err);
                }
                return;
            }
            callback();
        });

        function copy() {
            var readStream = fs.createReadStream(oldPath);
            var writeStream = fs.createWriteStream(newPath);

            readStream.on('error', callback);
            writeStream.on('error', callback);

            readStream.on('close', function () {
                fs.unlink(oldPath, callback);
            });

            readStream.pipe(writeStream);
        }
    }

    // Hash password
    static async getHashedPassword(password) {
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(password, salt);
    }

    static getExtensionByMimetype(mimetype) {
        console.log(mimetype)
        let extension = '';
        switch (mimetype) {
            case 'application/pdf':
                extension = 'pdf';
                break;
            case 'image/png':
                extension = 'png';
                break;
            case 'application/jpeg':
                extension = 'jpg';
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                extension = 'docx';
                break;
            case 'application/msword':
                extension = 'doc';
                break;
            case 'application/x-zip-compressed':
                extension = 'zip';
                break;
            case 'application/octet-stream':
                extension = 'dcm';
                break;
            default:
                extension = 'dcm';
                break
        }
        return extension;
    }

    static isDateEqualOrLessThanPresent(dateString) {
        return (new Date(dateString).getTime() <= new Date().getTime());
    }


    static addZeroPrefix(number, totalDigits) {
        return number.toString().padStart(totalDigits, '0');
    }

    static checkArray(array) {
        return Array.isArray(array) && array?.length
    }

    static uuidToDicomUID() {
        const uuid = uuidv4().replace(/-/g, ''); // Remove dashes
        const bigInt = BigInt('0x' + uuid);
        const dicomUID = '2.25.' + bigInt.toString(); // 2.25 is ISO standard for UUID-based UIDs
        return dicomUID;
    }

    static getEndOfDay(date) {
        if (date && new Date(date)) {
            let endOfDay = new Date(date);
            if (!isNaN(endOfDay)) {
                endOfDay.setHours(23, 59, 59, 999);
                return endOfDay.toISOString();
            }
        }
        return date;
    }
    static getStartOfDay(date) {
        if (date && new Date(date)) {
            let startOfDay = new Date(date);
            if (!isNaN(startOfDay)) {
                startOfDay.setHours(0, 0, 0, 0);
                return startOfDay.toISOString();
            }
        }
        return date;
    }

    static addInfoRow(ws, currentIndex, labels, user, footerStyle) {
        ws.cell(currentIndex, 1, currentIndex, labels.length, true)
            .string(`Bu tablisa ${this.getNameForSignature(user) || ''} tarapyndan ${this.getFormattedDate(new Date(), '.', true)} döredildi (HMDU-${CONSTANTS.HOSPITAL_CODE}).`)
            .style(footerStyle);
    }

    static addMetaSheet(wb, user) {
        const meta = wb.addWorksheet('Info');
        meta.cell(1, 1).string('Generated by:');
        meta.cell(1, 2).string(this.getNameForSignature(user) || '');
        meta.cell(2, 1).string('System:');
        meta.cell(2, 2).string(`HMDU-${CONSTANTS.HOSPITAL_CODE}`);
        meta.cell(3, 1).string('Generated on:');
        meta.cell(3, 2).string(this.getFormattedDate(new Date(), '.', true));
    }

    /**
     * Extract and normalize specimen ID
     * Supports formats:
     * - Full: YYMMDDNNN (e.g., "250202001")
     * - Short: NNN (e.g., "001") - auto-prefixed with current date
     * - With separators: YYMMDD-NNN, YYMMDD/NNN, etc.
     *
     * @param {string} rawId - Raw specimen ID from analyzer
     * @returns {string} - Normalized specimen ID in YYMMDDNNN format
     */
    static normalizeSpecimenId(rawId = "", is_sample_id_normalize = false) {
        const SPECIMEN_SPLITTERS = /[-\/\\]/;

        if (!rawId) return "";

        rawId = String(rawId).trim();
        // Remove separators
        const parts = rawId.split(SPECIMEN_SPLITTERS);
        const cleanId = String(parts[0] || "").trim();
        if (!cleanId) return "";
        // Check if it's a short format (NNN - daily increment only)
        if (is_sample_id_normalize && /^\d{1,3}$/.test(cleanId)) {
            // Short format detected - add today's prefix
            const today = new Date();
            const yy = String(today.getFullYear()).slice(-2);
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const nnn = cleanId.padStart(3, '0');

            const fullId = `${yy}${mm}${dd}${nnn}`;
            console.log(`Short specimen ID detected: "${cleanId}" → normalized to: "${fullId}"`);
            return fullId;
        }

        // Check if it's already in full format (YYMMDDNNN - 9 digits)
        if (/^\d{9}$/.test(cleanId)) {
            return cleanId;
        }

        // Invalid format
        console.warn(`Invalid specimen ID format: "${rawId}" (expected NNN or YYMMDDNNN)`);
        return cleanId; // Return as-is, let validation handle it
    }

    /**
     * Validate specimen ID format
     * @param {string} specimenId - Specimen ID to validate
     * @returns {Object} - { valid: boolean, error?: string, normalized?: string }
     */
    static validateSpecimenId(specimenId) {
        if (!specimenId) {
            return { valid: false, error: 'Specimen ID is required' };
        }

        const trimmed = String(specimenId).trim();

        if (trimmed.length === 0) {
            return { valid: false, error: 'Specimen ID cannot be empty' };
        }

        // Normalize the ID
        const normalized = FUNCTIONS.normalizeSpecimenId(trimmed);

        if (!normalized) {
            return { valid: false, error: 'Could not normalize specimen ID' };
        }

        // Validate normalized format (must be YYMMDDNNN)
        if (!/^\d{9}$/.test(normalized)) {
            return {
                valid: false,
                error: `Invalid specimen ID format: "${trimmed}" (expected YYMMDDNNN or NNN)`
            };
        }

        // Optional: Validate date portion is reasonable
        const yy = parseInt(normalized.slice(0, 2));
        const mm = parseInt(normalized.slice(2, 4));
        const dd = parseInt(normalized.slice(4, 6));

        if (mm < 1 || mm > 12) {
            return {
                valid: false,
                error: `Invalid month in specimen ID: ${mm}`
            };
        }

        if (dd < 1 || dd > 31) {
            return {
                valid: false,
                error: `Invalid day in specimen ID: ${dd}`
            };
        }

        return {
            valid: true,
            normalized,
            wasShortFormat: /^\d{1,3}$/.test(trimmed)
        };
    }

    /**
     * Legacy function - maintained for backward compatibility
     * Now calls normalizeSpecimenId internally
     */
    static extractBaseSpecimenId(rawId = "", is_sample_id_normalize = false) {
        const extracted_id = FUNCTIONS.normalizeSpecimenId(rawId, is_sample_id_normalize);
        return extracted_id;
    }

    // static extractBaseSpecimenId(rawId = "") {
    //     const SPECIMEN_SPLITTERS = /[-\/\\]/;
    //     if (!rawId) return "";
    //     rawId = String(rawId).trim();
    //     const parts = rawId.split(SPECIMEN_SPLITTERS);
    //     return String(parts[0] || "").trim();
    // }

    static extractByIndexRule(parts, indexRule, splitBy = "^") {
        if (!Array.isArray(parts)) return "";

        const rule = String(indexRule).trim();

        // Handle range rule (e.g., "3-8")
        if (rule.includes("-")) {
            const [startStr, endStr] = rule.split("-").map(v => v.trim());

            const start = Number(startStr);
            const end = Number(endStr);

            if (Number.isNaN(start) || Number.isNaN(end)) return "";

            return parts.slice(start, end).join(splitBy);
        }

        // Handle non-contiguous indices rule (e.g., "3.8" or "3.5.8")
        if (rule.includes(".")) {
            const indices = rule.split(".").map(v => Number(v.trim()));

            // Check if all indices are valid numbers
            if (indices.some(idx => Number.isNaN(idx))) return "";

            // Extract parts at specified indices and join
            return indices
                .map(idx => parts[idx] || "")
                .filter(Boolean)
                .join(splitBy);
        }

        // Handle single index rule (e.g., "3")
        const pos = Number(rule);
        if (Number.isNaN(pos)) return "";

        return parts[pos] || "";
    }

    static applyResultMapping(value, mappingObjectStr = '{}') {
        const { success, data: mappingObject = {} } = this.safeJsonParse(mappingObjectStr);
        if (!success || !Object.keys(mappingObject || {}).length) {
            console.error("Error while trying parse mapping_object");
            return null;
        }
        if (!value && value !== 0) return null;
        if (!mappingObject || !Object.keys(mappingObject).length) return null;

        const num = Number(value);
        if (Number.isNaN(num)) return null;

        for (const rangeStr of Object.keys(mappingObject)) {
            const normalized = rangeStr.replace(/\s+/g, "");

            // patterns:
            // "0-10"
            // "10-Infinity"
            // "-10"
            // "10-"
            const [rawStart, rawEnd] = normalized.split("-");

            let start = rawStart === "" ? -Infinity :
                rawStart.toLowerCase() === "infinity" ? Infinity :
                    Number(rawStart);

            let end = rawEnd === "" ? Infinity :
                rawEnd?.toLowerCase() === "infinity" ? Infinity :
                    Number(rawEnd);

            if (Number.isNaN(start) || Number.isNaN(end)) continue;

            // auto-fix reversed ranges (e.g., "20-10")
            if (start > end) {
                const tmp = start;
                start = end;
                end = tmp;
            }

            // inclusive: start <= num < end
            if (num >= start && num < end) {
                return mappingObject[rangeStr];
            }
        }

        return null;
    }

    static safeJsonParse(jsonString) {
        try {
            const parsedData = JSON.parse(jsonString);
            return { success: true, data: parsedData };
        } catch (error) {
            console.error("Error parsing JSON:", error.message);
            return { success: false, error: error.message };
        }
    }


    static extractNumber(str) {
        const standardizedStr = str.replace(',', '.');
        const match = standardizedStr.match(/[\d.]+/);
        if (match) {
            return parseFloat(match[0]);
        }
        return NaN;
    }

    static maskName(fullname) {
        return String(fullname || '').split(' ').map((name) => {
            if (!name || name.length <= 2) return name;

            const firstPart = name.slice(0, 2);

            if (name.length <= 4) {
                return firstPart + "*".repeat(name.length - 2);
            }

            const lastPart = name.slice(-2);
            const maskLength = name.length - 4;
            return `${firstPart}${"*".repeat(maskLength)}${lastPart}`;
        }).join(' ');
    }

    static buildStringFromHL7Segment(segment) {
        // 1. Find the maximum index in the data object
        // (e.g., if keys go up to QRD.12, max is 12)
        let maxIndex = 0;
        const dataKeys = Object.keys(segment.data);

        dataKeys.forEach(key => {
            // key format is usually 'SEG.Index' (e.g., 'QRD.12')
            const parts = key.split('.');
            if (parts.length >= 2) {
                const idx = parseInt(parts[1], 10);
                if (!isNaN(idx) && idx > maxIndex) {
                    maxIndex = idx;
                }
            }
        });

        const fields = [];

        // 2. Determine Start Index
        // Standard segments (QRD, PID) start data at Index 1.
        // MSH is special: Field 1 is the separator itself (|), so data starts at MSH.2 (^~\&)
        const startIndex = (segment.type === 'MSH') ? 2 : 1;

        // 3. Loop through indices numerically to ensure order
        for (let i = startIndex; i <= maxIndex; i++) {
            const key = `${segment.type}.${i}`;
            const val = segment.data[key];

            if (val === undefined || val === null) {
                fields.push('');
            } else if (typeof val === 'string') {
                // Simple string value
                fields.push(val);
            } else if (typeof val === 'object') {
                // Handle Components (like MSH.9 or CE fields)
                // Input: { 'MSH.9.1': 'QRY', 'MSH.9.2': 'Q02' }
                // Logic: Sort keys by sub-index to ensure QRY comes before Q02
                const componentKeys = Object.keys(val).sort((a, b) => {
                    const subIndexA = parseInt(a.split('.').pop(), 10);
                    const subIndexB = parseInt(b.split('.').pop(), 10);
                    return subIndexA - subIndexB;
                });

                const componentValues = componentKeys.map(k => val[k]);
                fields.push(componentValues.join('^'));
            }
        }

        // 4. Join with Pipe delimiter
        return `${segment.type}|${fields.join('|')}`;
    }

    static getAge(birthDate, end_date = undefined, langDictionary = null) {
        let today
        if (end_date) {
            today = new Date(end_date)
        } else {
            today = new Date()
        }
        const birth = new Date(birthDate)

        const diffInMs = today - birth
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

        if (diffInDays >= 365) {
            let years = today.getFullYear() - birth.getFullYear()
            const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
            if (today < birthdayThisYear) years -= 1
            return `${years} ${langDictionary?.year_label || 'ýaş'}`
        } else if (diffInDays >= 30) {
            const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
            const daysPastMonth = today.getDate() < birth.getDate() ? -1 : 0;
            return `${months + daysPastMonth} ${langDictionary?.month_label || 'aý'}`
        } else {
            return `${diffInDays} ${langDictionary?.day_label || 'gün'}`
        }
    }

    static getAgeOnYears(birthDate, end_date = undefined) {
        const today = end_date ? new Date(end_date) : new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        // Check if birthday hasn't occurred yet this year
        const hasBirthdayPassedThisYear =
            today.getMonth() > birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

        if (!hasBirthdayPassedThisYear) {
            age--;
        }
        return age;
    }

    static getAgeOnMonths(birthDate, end_date = undefined) {
        const today = end_date ? new Date(end_date) : new Date();
        const birth = new Date(birthDate);

        let months = (today.getFullYear() - birth.getFullYear()) * 12;
        months += today.getMonth() - birth.getMonth();

        if (today.getDate() < birth.getDate()) {
            months--;
        }

        return months;
    }

    static formatDate(date, format = 'YYYYMMDDHHmmss') {
        if (!date) return '';

        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }


    // ---
    static addNumericEqFilter(filter, field, value) {
        if (!isNaN(Number(value))) {
            filter[field] = { [Op.eq]: Number(value) };
        }
    };

    // ---
    static addStringILikeFilter(filter, field, value) {
        if (value) {
            filter[field] = { [Op.iLike]: `%${value}%` };
        }
    };

    // ---
    static addBooleanEqFilter(filter, field, value) {
        if (value !== undefined && value !== null) {
            filter[field] = { [Op.eq]: value };
        }
    };

    // ---
    static getOrderBy(sortBy = "date", sortOrder = "ASC") {
        const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";
        return [sortBy, order];
    };

    static gendersArr = [
        { title: "Erkek", value: 'M', img: 'boy.png' },
        { title: "Aýal", value: 'F', img: 'girl.png' },
    ];

    static genders = {
        M: 'Erkek',
        F: 'Aýal',
        U: 'Näbelli'
    }
    static gendersShort = {
        M: 'E',
        F: 'A',
        U: 'N'
    }
    static genderLabels = {
        M: 'male',
        F: 'female',
        U: 'unknown'
    }

    static PAYMENT_TYPE_SERVICE = 0;
    static PAYMENT_TYPE_BED = 1;
    static PAYMENT_TYPE_MEAL = 2;
    static PAYMENT_TYPE_DRUG = 3;
    static PAYMENT_TYPE_HISTOLOGY = 4;
    static PAYMENT_TYPE_RW = 5;
    static PAYMENT_TYPE_SPID = 6;
    static PAYMENT_TYPE_COPY = 7;
    static PAYMENT_TYPE_DOC = 8;
    static PAYMENT_TYPE_CONSUMER = 9;
    static PAYMENT_TYPE_BLANKS = 10;


    static regionTypes = {
        0: 'Welaýat',
        10: 'Şäher',
    };

    static districtTypes = {
        0: 'Etrap',
        10: 'Şäher',
    };

    static villageTypes = {
        0: 'Etrapdaky şäher',
        10: 'Şäherçe',
        20: 'Geňeşlik'
    };

    static getRegiteredPlace(model, isFull = false) {
        const region = model?._registered_region ? `${model?._registered_region?.name} ${String(this.regionTypes[model?._registered_region?.type]).toLowerCase().substring(0, 3)}.` : '';
        const district = model?._registered_district ? `${model?._registered_district?.name} ${String(this.districtTypes[model?._registered_district?.type]).toLowerCase().substring(0, 3)}.` : '';
        const village = model?._registered_village ? `${model?._registered_village?.name} ${String(this.villageTypes[model?._registered_village?.type]).toLowerCase().substring(0, 3)}.` : '';
        const living_place = isFull ? model?.living_place || '' : '';
        return `${region} ${district} ${village} ${living_place}`;
    }
};

module.exports = { FUNCTIONS };