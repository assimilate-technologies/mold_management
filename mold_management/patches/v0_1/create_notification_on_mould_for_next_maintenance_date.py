import frappe

def execute():
    notification_name = "Mould Maintenance {{doc.mould_name}}"

    # Avoid duplicate creation
    if frappe.db.exists("Notification", notification_name):
        return

    notification = frappe.get_doc({
        "doctype": "Notification",
        "name": notification_name,
        "enabled": 1,
        "subject": "🚨 Mould Maintenance Alert",
        "document_type": "Mould",
        "event": "Days Before",
        "date_changed": "next_maintenance_due",
        "days_before": 7,
        "send_system_notification": 1,
        "channel": "Email",
        "message": """
<p>Dear Team,</p>

<p>
🛠️ <strong>Mould Maintenance Alert</strong>
</p>

<p>
The maintenance date for mould <strong>{{ doc.mould_name }}</strong> is scheduled on
<strong>{{ doc.next_maintenance_due }}</strong>.
</p>

<p>
❗ Please take the necessary action at the earliest to avoid any operational impact. ❗
</p>

<p>
Thanks & Regards,<br>
<strong>Team ERPNext</strong>
</p>
        """,
        "recipients": [
            {
                "receiver_by_role": "Business HOD"
            }
        ]
    })

    notification.insert(ignore_permissions=True)
    frappe.db.commit()
