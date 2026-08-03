import frappe


def execute():
    # Step 1: Create Tab Break for "Mould Details"
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "packing_details_tab"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "packing_details_tab",
            "label": "Packing Details",
            "fieldtype": "Tab Break",
            "insert_after": "mould"
        }).insert(ignore_permissions=True)

    # Step 2: Create Section Break inside Mould Details tab
    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "poly_bag_section"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "poly_bag_section",
            "label": "Poly Bag Section",
            "fieldtype": "Section Break",
            "insert_after": "packing_details_tab"
        }).insert(ignore_permissions=True)

    if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": "box_packing_section"}):
        frappe.get_doc({
            "doctype": "Custom Field",
            "dt": "Item",
            "fieldname": "box_packing_section",
            "label": "Box Packing Section",
            "fieldtype": "Section Break",
            "insert_after": "poly_bag_section"
        }).insert(ignore_permissions=True)



    # Step 3: Create custom fields under the section
    custom_fields = [

        {
            "fieldname": "req_poly_bags_sizes",
            "label": "Req Polybag Sizes",
            "fieldtype": "Link",
            "options": "Item",
            "insert_after": "poly_bag_section"
        },
        {
            "fieldname": "standard_pkg_of_polybag",
            "label": "Standard Pkg of Polybag",
            "fieldtype": "Int",
            "insert_after": "req_poly_bags_sizes"
        },
        {
            "fieldname": "req_boxsizes",
            "label": "Req Box Sizes",
            "fieldtype": "Link",
            "options": "Item",
            "insert_after": "box_packing_section"
        },
        {
            "fieldname": "std_pkg_box",
            "label": "Standard Pkg of Box",
            "fieldtype": "Int",
            "insert_after": "req_boxsizes"
        },
        {
            "fieldname": "req_total_box",
            "label": "Req Total Box",
            "fieldtype": "Int",
            "insert_after": "std_pkg_box"
        }



    ]




    for field in custom_fields:
        if not frappe.db.exists("Custom Field", {"dt": "Item", "fieldname": field["fieldname"]}):
            frappe.get_doc({
                "doctype": "Custom Field",
                "dt": "Item",
                **field
            }).insert(ignore_permissions=True)

    frappe.clear_cache()

