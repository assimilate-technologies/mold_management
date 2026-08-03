import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field


def execute():
    # ---- Added new custom field for Item ----
    field = {
        "fieldname": "mould_name",
        "label": "Mould Name",
        "fieldtype": "Data",      # You can change to Link/Select if needed
        "insert_after": "mould_selection_table"
    }

    create_custom_field("Item", field)

    frappe.clear_cache()
