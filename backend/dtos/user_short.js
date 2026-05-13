class UserShortDTO {
    id;
    assignment_id;
    name;
    surname;
    second_name;
    role;
    _role;
    department;
    position;
    timestamp;

    constructor(model, assignment = null) {
        this.id = model?.id;
        this.assignment_id = assignment?.id || null;
        this.name = model?.name;
        this.surname = model?.surname;
        this.second_name = model?.second_name;
        this.role = assignment?.position?.role_id || model?.role;
        this._role = assignment?.position?.role ?? model._role ?? null;
        this.department = assignment?.position?.department || model?.department;
        this._department = assignment?.position?._department || model?._department;
        this.position = assignment?.position_id || model?.position;
        this.timestamp = new Date().getTime();
    }
}

module.exports = UserShortDTO;