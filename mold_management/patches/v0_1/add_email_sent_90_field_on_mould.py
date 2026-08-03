import frappe


def execute():
    # Check if the custom field already exists
    if not frappe.db.exists("Custom Field", "Mould-email_sent_90_percent"):

        custom_field = {
            "doctype": "Custom Field",
            "dt": "Mould",
            "fieldname": "email_sent_90_percent",
            "label": "Email Sent 90%",
            "fieldtype": "Check",
            "default": "0",
            "hidden": 1,
            "insert_after": "maximum_usage_count",  # adjust if needed
        }

        frappe.get_doc(custom_field).insert()
        frappe.db.commit()
        frappe.logger().info("Custom field 'email_sent_90_percent' added to Mould doctype")
