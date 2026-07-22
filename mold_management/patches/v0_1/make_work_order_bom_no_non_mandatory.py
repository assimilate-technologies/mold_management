import frappe
from frappe.custom.doctype.property_setter.property_setter import make_property_setter


def execute():
    property_setter_name = "Work Order-bom_no-reqd"
    if not frappe.db.exists("Property Setter", property_setter_name):
        make_property_setter(
            "Work Order",
            "bom_no",
            "reqd",
            0,
            "Check",
            validate_fields_for_doctype=False,
        )
        frappe.db.commit()
