# if doc.is_mould and doc.mould and doc.total_completed_qty:
#     mould_doc = frappe.get_doc("Mould", doc.mould)

#     frappe.log_error("Updating mould usage")

#     # Add completed qty to existing usage
#     previous_usage = frappe.utils.flt(mould_doc.current_usage_count or 0)
#     new_usage = previous_usage + frappe.utils.flt(doc.total_completed_qty)

#     mould_doc.current_usage_count = new_usage
#     mould_doc.save(ignore_permissions=True)

#     # Check if usage exceeded maximum limit
#     # if frappe.utils.flt(mould_doc.current_usage_count) > frappe.utils.flt(mould_doc.maximum_usage_count):

#     #     users_to_notify = ["kulkarnirahul134@gmail.com"]

#     #     for user_email in users_to_notify:
#     #         notification = frappe.new_doc("Notification Log")
#     #         notification.subject = f"Mould {mould_doc.name} Shot Limit Exceeded"
#     #         notification.for_user = user_email
#     #         notification.type = "Alert"
#     #         notification.document_type = "Mould"
#     #         notification.document_name = mould_doc.name
#     #         notification.from_user = frappe.session.user
#     #         notification.email_content = (
#     #             f"Mould <b>{mould_doc.name}</b> exceeded shot limit.<br><br>"
#     #             f"Current Shots: {mould_doc.current_usage_count}<br>"
#     #             f"Maximum Shots: {mould_doc.maximum_no_of_shots}"
#     #         )
#     #         notification.insert(ignore_permissions=True)





# below script

# import frappe

# @frappe.whitelist()
# def update_mould_usage(docname):
#     """
#     Update mould usage based on Job Card submission
#     docname = Job Card name
#     """

#     doc = frappe.get_doc("Job Card", docname)

#     if doc.is_mould and doc.mould and doc.total_completed_qty:

#         mould_doc = frappe.get_doc("Mould", doc.mould)

#         frappe.log_error("Updating mould usage")

#         # Add completed qty to existing usage
#         previous_usage = frappe.utils.flt(mould_doc.current_usage_count or 0)
#         new_usage = previous_usage + frappe.utils.flt(doc.total_completed_qty)

#         mould_doc.current_usage_count = new_usage
#         mould_doc.save(ignore_permissions=True)

#         # ---- OPTIONAL NOTIFICATION (UNCOMMENT IF NEEDED) ----
#         # if frappe.utils.flt(mould_doc.current_usage_count) > frappe.utils.flt(mould_doc.maximum_usage_count):
#         #
#         #     users_to_notify = ["kulkarnirahul134@gmail.com"]
#         #
#         #     for user_email in users_to_notify:
#         #         notification = frappe.new_doc("Notification Log")
#         #         notification.subject = f"Mould {mould_doc.name} Shot Limit Exceeded"
#         #         notification.for_user = user_email
#         #         notification.type = "Alert"
#         #         notification.document_type = "Mould"
#         #         notification.document_name = mould_doc.name
#         #         notification.from_user = frappe.session.user
#         #         notification.email_content = (
#         #             f"Mould <b>{mould_doc.name}</b> exceeded shot limit.<br><br>"
#         #             f"Current Shots: {mould_doc.current_usage_count}<br>"
#         #             f"Maximum Shots: {mould_doc.maximum_no_of_shots}"
#         #         )
#         #         notification.insert(ignore_permissions=True)

#     return "Mould usage updated"



# import frappe

# def update_mould_usage(doc, method):
#     """
#     This is triggered from hooks.py:
#     'on_update': 'mold_management.api.mould_shots_updated_on_jo_card_completed_qty.update_mould_usage'

#     Frappe automatically passes:
#         doc    = Job Card document
#         method = on_update
#     """

#     if doc.is_mould and doc.mould and doc.total_completed_qty:

#         mould_doc = frappe.get_doc("Mould", doc.mould)

#         frappe.log_error("Updating mould usage from Hook")

#         previous_usage = frappe.utils.flt(mould_doc.current_usage_count or 0)
#         new_usage = previous_usage + frappe.utils.flt(doc.total_completed_qty)

#         mould_doc.current_usage_count = new_usage
#         mould_doc.save(ignore_permissions=True)

#     return "Mould usage updated"



import frappe


def update_mould_usage(doc, method):

    # HARD DEBUG LOG — this will PROVE if hook is firing
    frappe.log_error("JOB CARD SUBMIT TRIGGERED", doc.name)

    if not doc.mould:
        frappe.log_error("NO MOULD FOUND", doc.name)
        return

    qty = frappe.utils.flt(doc.total_completed_qty)

    if qty <= 0:
        frappe.log_error("QTY IS ZERO", doc.name)
        return

    mould_doc = frappe.get_doc("Mould", doc.mould)

    previous_usage = frappe.utils.flt(mould_doc.current_usage_count or 0)

    new_usage = previous_usage + qty

    mould_doc.current_usage_count = new_usage
    mould_doc.save(ignore_permissions=True)

    frappe.log_error(
        "MOULD UPDATED",
        f"Mould: {doc.mould} | Old: {previous_usage} | Added: {qty} | New: {new_usage}"
    )
