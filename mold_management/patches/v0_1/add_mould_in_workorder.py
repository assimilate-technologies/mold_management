import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def execute():
    # Hidden checkbox on Work Order that fetches the value from selected Item (production_item)
    field_is_moulding = {
        "fieldname": "is_moulding",
        "label": "Is Moulding (Item)",
        "fieldtype": "Check",
        "insert_after": "sales_order",
        "hidden": 1,
        "read_only": 1,
        "fetch_from": "production_item.is_moulding"
    }

    # Mould link field, visible only when the fetched is_moulding is checked
    field_mould = {
        "fieldname": "mould",
        "label": "Mould",
        "fieldtype": "Link",
        "options": "Mould",
        "insert_after": "is_moulding",
        "depends_on": "eval:doc.is_moulding == 1"
    }

    try:
        create_custom_field("Work Order", field_is_moulding)
        create_custom_field("Work Order", field_mould)
        frappe.clear_cache()
    except Exception as e:
        frappe.log_error(f"Error adding mould fields to Work Order: {str(e)}", "add_mould_in_workorder")
