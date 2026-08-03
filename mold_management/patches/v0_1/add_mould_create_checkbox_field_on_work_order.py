import frappe


def execute():
    # Check if field already exists
    if not frappe.db.exists("Custom Field", "Work Order-mould_created"):

        custom_field = {
            "doctype": "Custom Field",
            "dt": "Work Order",
            "fieldname": "mould_created",
            "label": "Mould Created",
            "fieldtype": "Check",
            "hidden": 1,                # hide field
            "default": "0",
             "allow_on_submit": 1,
            "insert_after": "project"    # place field after status (optional)
        }

        frappe.get_doc(custom_field).insert(ignore_permissions=True)
        frappe.db.commit()
        print("✔ Custom Field 'mould_created' created successfully!")
