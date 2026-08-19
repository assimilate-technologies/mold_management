# import frappe
# from frappe.utils import flt


# def get_emails_by_roles(roles):
#     """
#     Fetch all enabled user emails having any of the given roles
#     """
#     users = frappe.db.get_all(
#         "Has Role",
#         filters={"role": ["in", roles]},
#         fields=["parent"]
#     )

#     if not users:
#         return []

#     emails = frappe.db.get_all(
#         "User",
#         filters={
#             "name": ["in", [u.parent for u in users]],
#             "enabled": 1
#         },
#         pluck="email"
#     )

#     return list(set(emails))  # remove duplicates


# def check_mould_usage(doc, method=None):
#     current = flt(doc.current_usage_count)
#     maximum = flt(doc.total_shots)

#     if maximum <= 0:
#         return

#     percentage = (current / maximum) * 100

#     if 90 <= percentage < 100 and not doc.email_sent_90_percent:

#         # 🔹 Roles to notify
#         ROLES_TO_NOTIFY = [
#             "Marketing Executive",
#             "Marketing Manager/HOD",
#             "Business HOD",
#             "Design HOD"
#         ]

#         users_to_notify = get_emails_by_roles(ROLES_TO_NOTIFY)

#         if not users_to_notify:
#             frappe.log_error(
#                 f"No users found for roles: {', '.join(ROLES_TO_NOTIFY)}",
#                 "Mould 90% Notification"
#             )
#             return

#         subject = f"⚠️ Mould {doc.name} Reached 90% Shot Capacity"

#         email_content = (
#             f"<b>⚠️ Warning!</b><br><br>"
#             f"Mould <b>{doc.name}</b> has reached "
#             f"<b>{percentage:.2f}%</b> of its shot capacity.<br><br>"
#             f"<b>📊 Usage Details:</b><br>"
#             f"🔢 Current Usage Count: <b>{current}</b><br>"
#             f"🎯 Maximum Usage Count: <b>{maximum}</b><br><br>"
#             f"Please take the necessary action to avoid production disruption.<br><br>"
#             f"Regards,<br>"
#             f"<b>ERPNext Team</b>"
#         )

#         # Create Notification Logs
#         for user_email in users_to_notify:
#             notification = frappe.new_doc("Notification Log")
#             notification.subject = subject
#             notification.for_user = user_email
#             notification.type = "Alert"
#             notification.document_type = "Mould"
#             notification.document_name = doc.name
#             notification.from_user = frappe.session.user
#             notification.email_content = email_content
#             notification.insert(ignore_permissions=True)

#         # Send Email (single mail to all)
#         frappe.sendmail(
#             recipients=users_to_notify,
#             subject=subject,
#             message=email_content,
#             delayed=False
#         )

#         # Mark as sent
#         frappe.db.set_value("Mould", doc.name, "email_sent_90_percent", 1)
#         frappe.db.commit()

import frappe
from frappe.utils import flt


def get_emails_by_roles(roles):
    """
    Return list of active user emails for given roles
    """
    if not roles:
        return []

    users = frappe.db.sql(
        """
        SELECT DISTINCT u.email
        FROM `tabUser` u
        INNER JOIN `tabHas Role` r ON r.parent = u.name
        WHERE r.role IN %(roles)s
          AND u.enabled = 1
          AND u.email IS NOT NULL
          AND u.email != ''
        """,
        {"roles": tuple(roles)},
        as_dict=True
    )

    return [u.email for u in users]


def check_mould_usage(doc, method=None):
    current = flt(doc.current_usage_count)
    total = flt(doc.total_shots)

    # Safety check
    if total <= 0:
        return

    # 🔔 Trigger when usage reaches total shots (100%)
    if current == total and not doc.email_sent_90_percent:

        # 🔹 Roles to notify
        ROLES_TO_NOTIFY = [
            "Marketing Executive",
            "Marketing Manager/HOD",
            "Business HOD",
            "Design HOD"
        ]

        users_to_notify = get_emails_by_roles(ROLES_TO_NOTIFY)

        if not users_to_notify:
            frappe.log_error(
                f"No users found for roles: {', '.join(ROLES_TO_NOTIFY)}",
                "Mould Shot Limit Notification"
            )
            return

        subject = f"🚨 Mould {doc.name} Shot Limit Reached"

        email_content = (
            f"<b>🚨 Critical Alert!</b><br><br>"
            f"Mould <b>{doc.name}</b> has <b>reached its maximum shot limit</b>.<br><br>"
            f"<b>📊 Usage Details:</b><br>"
            f"🔢 Current Usage Count: <b>{current}</b><br>"
            f"🎯 Total Allowed Shots: <b>{total}</b><br><br>"
            f"<b>⚠️ Action Required:</b><br>"
            f"Please stop production and schedule mould maintenance immediately "
            f"to avoid mould damage or quality issues.<br><br>"
            f"Regards,<br>"
            f"<b>ERPNext Team</b>"
        )

        # 📌 Create Notification Logs
        for user_email in users_to_notify:
            notification = frappe.new_doc("Notification Log")
            notification.subject = subject
            notification.for_user = user_email
            notification.type = "Alert"
            notification.document_type = "Mould"
            notification.document_name = doc.name
            notification.from_user = frappe.session.user
            notification.email_content = email_content
            notification.insert(ignore_permissions=True)

        # 📧 Send Email
        frappe.sendmail(
            recipients=users_to_notify,
            subject=subject,
            message=email_content,
            delayed=False
        )

        # ✅ Mark as sent (avoid duplicate notifications)
        frappe.db.set_value("Mould", doc.name, "email_sent_90_percent", 1)
        frappe.db.commit()
