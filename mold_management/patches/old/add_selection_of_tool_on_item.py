import frappe

def execute():
    # Fieldname for internal use
    fieldname = "mould_selection_table"

    # Avoid duplicate creation
    if not frappe.db.exists("Custom Field", f"Item-{fieldname}"):

        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": fieldname,
            "label": "Mould Selection",
            "fieldtype": "Table",
            "options": "Mould Selection",     # Child Table Doctype
            "insert_after": "mould_details_section"
        }).insert()

        frappe.clear_cache(doctype="Item")
