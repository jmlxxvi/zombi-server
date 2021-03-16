-- -----------------------------------------------------
-- This query is used on the function system/users:table
-- -----------------------------------------------------
select
    usr.id,
    usr.username,
    usr.fullname,
    usr.email,
    usr.timezone,
    usr.country,
    usr.language,
    usr.enabled,
    us2.fullname as "created_by",
    usr.created_ts,
    usr.enabled
from users usr
join users us2 on (usr.created_by = us2.id)
where 1=1
and (
    lower(usr.username) like concat('%', concat(lower(:search), '%')) or
    lower(usr.fullname) like concat('%', concat(lower(:search), '%')) or
    lower(usr.email) like concat('%', concat(lower(:search), '%'))
)