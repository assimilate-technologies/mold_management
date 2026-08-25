# import frappe
# from frappe.utils import flt

# def reset_mould_usage_on_submit(doc, method=None):
#     # Run only after submit
#     if doc.docstatus != 1:
#         return

#     if not doc.mould_maintenance:
#         return

#     # Get Mould Maintenance
#     mould_maintenance = frappe.get_doc(
#         "Mould Maintenance",
#         doc.mould_maintenance
#     )

#     if not mould_maintenance.mould_name:
#         return

#     # Get Mould
#     mould = frappe.get_doc(
#         "Mould",
#         mould_maintenance.mould_name
#     )

#     # Read existing values safely
#     existing_max = flt(mould.maximum_usage_count)
#     total_shots = flt(mould.total_shots)

#     # Calculate new maximum usage count
#     new_maximum = existing_max + total_shots

#     # Update Mould
#     mould.db_set("current_usage_count", 0)
#     mould.db_set("maximum_usage_count", new_maximum)



# import frappe
# from frappe.utils import flt

# def reset_mould_usage_on_submit(doc, method=None):
#     # Run only after submit
#     if doc.docstatus != 1:
#         return

#     if not doc.mould_maintenance:
#         return

#     # Get Mould Maintenance
#     mould_maintenance = frappe.get_doc(
#         "Mould Maintenance",
#         doc.mould_maintenance
#     )

#     if not mould_maintenance.mould_name:
#         return

#     # Get Mould
#     mould = frappe.get_doc(
#         "Mould",
#         mould_maintenance.mould_name
#     )

#     # Read existing values
#     current_usage = flt(mould.current_usage_count)
#     total_shots = flt(mould.total_shots)

#     # Update values
#     mould.db_set("total_shots", total_shots + current_usage)
#     mould.db_set("current_usage_count", 0)


import frappe
from frappe.utils import flt

def reset_mould_usage_on_submit(doc, method=None):
    # Run only after submit
    if doc.docstatus != 1:
        return

    if not doc.mould_maintenance:
        return

    # Prevent double execution
    if frappe.flags.mould_usage_updated:
        return
    frappe.flags.mould_usage_updated = True

    mould_maintenance = frappe.get_doc(
        "Mould Maintenance",
        doc.mould_maintenance
    )

    if not mould_maintenance.mould_name:
        return

    mould = frappe.get_doc("Mould", mould_maintenance.mould_name)

    # READ values ONCE
    current_usage = flt(mould.current_usage_count)
    previous_maximum = flt(mould.maximum_usage_count)

    # IMPORTANT: do nothing if already reset
    if current_usage == 0:
        return

    new_maximum = previous_maximum + current_usage

    # SINGLE atomic update
    frappe.db.set_value(
        "Mould",
        mould.name,
        {
            "maximum_usage_count": new_maximum,
            "current_usage_count": 0
        },
        update_modified=False
    )
