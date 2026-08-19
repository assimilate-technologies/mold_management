# Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.model.document import Document
from frappe.query_builder import DocType
from frappe.utils import getdate, nowdate, today

from mold_management.mold_management.doctype.mould_maintenance.mould_maintenance import calculate_next_due_date


class MouldMaintenanceOrder(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		actions_performed: DF.TextEditor | None
		amended_from: DF.Link | None
		mould_maintenance: DF.Link | None
		mould_name: DF.ReadOnly | None
		assign_to_name: DF.ReadOnly | None
		certificate_attachement: DF.Attach | None
		completion_date: DF.Date | None
		description: DF.ReadOnly | None
		due_date: DF.Date | None
		has_certificate: DF.Check
		maintenance_status: DF.Literal["Planned", "Completed", "Cancelled", "Overdue"]
		maintenance_type: DF.ReadOnly | None
		naming_series: DF.Literal["ACC-AML-.YYYY.-"]
		periodicity: DF.Data | None
		task: DF.Link | None
		task_assignee_email: DF.Data | None
		task_name: DF.Data | None
		maintenance_team: DF.Literal["In-house", "Out-source"]
	# end: auto-generated types


	def validate(self):
		if getdate(self.due_date) < getdate(nowdate()) and self.maintenance_status not in [
			"Completed",
			"Cancelled",
		]:
			self.maintenance_status = "Overdue"

		if self.maintenance_status == "Completed" and not self.completion_date:
			frappe.throw(_("Please select Completion Date for Completed Mould Maintenance Order"))

		if self.maintenance_status != "Completed" and self.completion_date:
			frappe.throw(_("Please select Maintenance Status as Completed or remove Completion Date"))

	def on_submit(self):
		if self.maintenance_status not in ["Completed", "Cancelled"]:
			frappe.throw(_("Maintenance Status has to be Cancelled or Completed to Submit"))
		self.update_maintenance_task()

	def update_maintenance_task(self):
		mould_maintenance_doc = frappe.get_doc("Mould Maintenance Task", self.task)
		if self.maintenance_status == "Completed":
			if mould_maintenance_doc.last_completion_date != self.completion_date:
				next_due_date = calculate_next_due_date(
					periodicity=self.periodicity, last_completion_date=self.completion_date
				)
				mould_maintenance_doc.last_completion_date = self.completion_date
				mould_maintenance_doc.next_due_date = next_due_date
				mould_maintenance_doc.maintenance_status = "Planned"
				mould_maintenance_doc.save()
		if self.maintenance_status == "Cancelled":
			mould_maintenance_doc.maintenance_status = "Cancelled"
			mould_maintenance_doc.save()
		mould_maintenance_doc = frappe.get_doc("Mould Maintenance", self.mould_maintenance)
		mould_maintenance_doc.save()


def update_mould_maintenance_order_status():
	MouldMaintenanceOrder = DocType("Mould Maintenance Order")
	(
		frappe.qb.update(MouldMaintenanceOrder)
		.set(MouldMaintenanceOrder.maintenance_status, "Overdue")
		.where(
			(MouldMaintenanceOrder.maintenance_status == "Planned") & (MouldMaintenanceOrder.due_date < today())
		)
	).run()


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def get_maintenance_tasks(doctype, txt, searchfield, start, page_len, filters):
	mould_maintenance_tasks = frappe.db.get_values(
		"Mould Maintenance Task", {"parent": filters.get("mould_maintenance")}, "maintenance_task"
	)
	return mould_maintenance_tasks
