class STATUSES {
    static ST_DIAGNOSE = 10
    static CL_DIAGNOSE = 20
    static FN_DIAGNOSE = 30
    static PM_DIAGNOSE = 40

    static PRE_OP_DG = 0
    static POST_OP_DG = 20

    static STATUSE_ACTIVE = 0
    static STATUSE_COMPLETED = 10
    static STATUSE_INACTIVE = 99

    static USER_INACTIVE = 0
    static USER_ACTIVE = 10
    static USER_BLOCKED = 90
    static USER_DELETED = 99

    static TR_ACTIVE = 0
    static TR_CLOSED = 99

    static PAYMENT_NOPAYED = 0;
    static PAYMENT_PAYED = 10;
    static PAYMENT_REJECTED = 99;

    static ANALYSE_QUEUE = 0;
    static ANALYSE_WAIT = 10;
    static ANALYSE_COMPLETED = 20;
    static ANALYSE_REJECTED = 99;

    static VISIT_OPEN = 0;
    static VISIT_CLOSE = 10;
    static VISIT_REJECTED = 99;

    static OPERATION_QUEUE = 0;
    static OPERATION_COMPLETED = 10;
    static OPERATION_REJECTED = 99;

    static NOTE_NORMAL = 0;
    static NOTE_GOOD = 10;
    static NOTE_DANGER = 20;

    static ANALYSE_NOTES = {
        [this.NOTE_NORMAL]: 'Kadaly',
        [this.NOTE_GOOD]: 'Gowy',
        [this.NOTE_DANGER]: 'Howply'
    }

    static NOTE_THEMES = {
        [this.NOTE_NORMAL]: 'primary',
        [this.NOTE_GOOD]: 'success',
        [this.NOTE_DANGER]: 'danger'
    }


    static ANALYSE_STATUSES = {
        [this.ANALYSE_QUEUE]: 'Nobata duran',
        [this.ANALYSE_WAIT]: 'Netijesi garaşylýan',
        [this.ANALYSE_COMPLETED]: 'Netijesi taýýar',
        [this.ANALYSE_REJECTED]: 'Ret edilen',
    }

    static ANALYSE_TEHEMES = {
        [this.ANALYSE_QUEUE]: 'warning',
        [this.ANALYSE_WAIT]: 'primary',
        [this.ANALYSE_COMPLETED]: 'success',
        [this.ANALYSE_REJECTED]: 'danger',
    }

    static OPERATION_STATUSES = {
        [this.OPERATION_QUEUE]: 'Garaşylýan',
        [this.OPERATION_COMPLETED]: 'Tamamlanan',
        [this.OPERATION_REJECTED]: 'Ret edilen',
    }

    static OPERATION_TEHEMES = {
        [this.OPERATION_QUEUE]: 'warning',
        [this.OPERATION_COMPLETED]: 'success',
        [this.OPERATION_REJECTED]: 'danger',
    }

    static PAYMENT_STATUSES = {
        [this.PAYMENT_NOPAYED]: 'Tölenmedik',
        [this.PAYMENT_PAYED]: 'Tölenen',
        [this.PAYMENT_REJECTED]: 'Ret edilen',
    }

    static PAYMENT_THEMES = {
        [this.PAYMENT_NOPAYED]: 'warning',
        [this.PAYMENT_PAYED]: 'primary',
        [this.PAYMENT_REJECTED]: 'danger'
    }

    static VISIT_STATUSES = {
        [this.VISIT_OPEN]: 'Açyk',
        [this.VISIT_CLOSE]: 'Ýapyk',
        [this.VISIT_REJECTED]: 'Ret edilen',
    }

    static VISIT_THEMES = {
        [this.VISIT_OPEN]: 'primary',
        [this.VISIT_CLOSE]: 'secondary',
        [this.VISIT_REJECTED]: 'danger',
    }

    static LABORATORY = 10
    static RADIOLOGY = 20
    static SPEC = 30
    static INSTRUMENTAL = 40

    static UNITS = {
        [this.LABORATORY]: 'Laboratoriýa',
        [this.RADIOLOGY]: 'Radiologiýa',
        [this.SPEC]: 'Inçe hünärmenler',
        [this.INSTRUMENTAL]: 'Enjamlaýyn',
    }

    static UNIT_THEMES = {
        [this.LABORATORY]: 'primary',
        [this.RADIOLOGY]: 'success',
        [this.SPEC]: 'warning'
    }

    static UNIT_ROUTES = {
        [this.LABORATORY]: 'laboratory',
        [this.RADIOLOGY]: 'radiology',
        [this.SPEC]: ''
    }

    static NOT_VISIT = 10
    static NOT_LAB = 20
    static NOT_RAD = 30
    static NOT_SPEC = 40
    static NOT_PAYMENT = 50

    // Marketplace notification types
    static NOT_ORDER          = 100
    static NOT_SHOP_REVIEW    = 110
    static NOT_SHOP_REJECTED  = 111
    static NOT_REVIEW         = 120
    static NOT_DISPUTE        = 130

    static USER_DOCTOR = 0
    static USER_CASHIER = 10

    static APPOINTMENT_PRESCRIPTION = 0
    static APPOINTMENT_ANLYSE = 10

    static BLOOD_1 = 10
    static BLOOD_2 = 20
    static BLOOD_3 = 30
    static BLOOD_4 = 40
    static BLOOD_5 = 50
    static BLOOD_6 = 60
    static BLOOD_7 = 70
    static BLOOD_8 = 80

    static BLOODS = {
        [this.BLOOD_1]: 'I(O) RH+',
        [this.BLOOD_2]: 'II(A) RH+',
        [this.BLOOD_3]: 'III(B) RH+',
        [this.BLOOD_4]: 'IV(AB) RH+',
        [this.BLOOD_5]: 'I(O) RH-',
        [this.BLOOD_6]: 'II(A) RH-',
        [this.BLOOD_7]: 'III(B) RH-',
        [this.BLOOD_8]: 'IV(AB) RH-'
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


    static ACCOUNTING_TYPE_NON_BUDGET = 'non_budget';
    static ACCOUNTING_TYPE_BUDGET = 'budget';

    static ACCOUNTING_TYPES = [
        { id: this.ACCOUNTING_TYPE_NON_BUDGET, name: 'Hojalyk hasaplaşygy' },
        { id: this.ACCOUNTING_TYPE_BUDGET, name: 'Býudjet hasaplaşygy' },
    ];

    static JOURNAL_TYPE_AMBULATOR = 'ambulator';
    static JOURNAL_TYPE_STATIONARY = 'stationary';


    static EXPORT_TYPE_SERVICES = 0;
    static EXPORT_TYPE_PAYMENTS = 10;
    static EXPORT_TYPE_DISCOUNTS = 20;
    static EXPORT_TYPE_PREPAYMENTS = 30;
    static EXPORT_TYPE_PAYMENT_JOURNAL = 40;

    static QS_STRING = 0
    static QS_BOOL = 10
    static QS_TEXT = 20
    static QS_MULTIPLE = 30
    static QS_SINGLE = 40
}

module.exports = STATUSES