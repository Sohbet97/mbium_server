class UserDTO {
    id;
    name;
    surname;
    second_name;
    role;
    permissions;
    position;
    _position;
    status;
    last_login_date;
    last_login_ip;
    last_logins;
    position_assignments;
    _assignment;
    timestamp;

    constructor(model, assignment = null) {
        this.id = model?.id;
        this.assignment_id = assignment?.id || null;
        this.name = model?.name;
        this.surname = model?.surname;
        this.second_name = model?.second_name;
        this.role = assignment?.position?.role_id || model?.role;
        this._role = assignment?.position?.role ?? model._role ?? null;
        this._department = assignment?.position?._department || model?._department;
        this.department = assignment?.position?.department || model?.department;
        this._specialization = model?._specialization;
        this.permissions = model?.permissions;
        this.status = model?.status;
        this.specialization = model?.specialization;
        this.position = assignment?.position_id || model?.position;
        this._position = model?._position;
        this.thumbnail = model?.thumbnail;
        this.last_login_date = model?.last_login_date;
        this.last_login_ip = model?.last_login_ip;
        this.last_logins = model?.last_logins;
        this.position_assignments = model?.position_assignments?.map(({ id, position_id, assignment_type, started_at, ended_at, is_active, position }) => ({
            id,
            position_id,
            assignment_type,
            started_at,
            ended_at,
            is_active,
            ...(position && {
                position: {
                    id: position.id,
                    name: position.name,
                    role_id: position.role_id,
                    ...(position.role && {
                        role: {
                            name: position.role.name,
                            status: position.role.status,
                        },
                    }),
                    ...(position._department && {
                        _department: {
                            name: position._department.name,
                            unit: position._department.unit,
                        },
                    }),
                },
            }),
        }));
        this._assignment = assignment
            ? {
                id: assignment.id,
                assignment_type: assignment.assignment_type,
                position_id: assignment.position_id,
                position_name: assignment.position?.name ?? null,
            }
            : null;
        this.timestamp = new Date().getTime();
    }
}

module.exports = UserDTO;