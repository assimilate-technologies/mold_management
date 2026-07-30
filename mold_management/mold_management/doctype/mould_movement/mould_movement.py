# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cstr, get_link_to_form

# from mold_management.mold_management.doctype.asset_activity.asset_activity import add_asset_activity


class MouldMovement(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from mold_management.assets.doctype.asset_movement_item.asset_movement_item import MouldMovementItem

		amended_from: DF.Link | None
		assets: DF.Table[MouldMovementItem]
		company: DF.Link
		purpose: DF.Literal["", "Issue", "Receipt", "Transfer", "Transfer and Issue"]
		reference_doctype: DF.Link | None
		reference_name: DF.DynamicLink | None
		transaction_date: DF.Datetime
	# end: auto-generated types

	def validate(self):
		for d in self.assets:
			self.validate_asset(d)
			self.validate_movement(d)

	def validate_asset(self, d):
		status, company = frappe.db.get_value("Mould", d.asset, ["status", "company"])
		if self.purpose == "Transfer" and status in ("Draft", "Scrapped", "Sold"):
			frappe.throw(_("{0} mould cannot be transferred").format(status))

		if company != self.company:
			frappe.throw(_("Mould {0} does not belong to company {1}").format(d.asset, self.company))

	def validate_movement(self, d):
		if self.purpose == "Transfer and Issue":
			self.validate_location_and_employee(d)
		elif self.purpose in ["Receipt", "Transfer"]:
			self.validate_location(d)
		else:
			self.validate_employee(d)

	def validate_location_and_employee(self, d):
		self.validate_location(d)
		self.validate_employee(d)

	def validate_location(self, d):
		if self.purpose in ["Transfer", "Transfer and Issue"]:
			current_location = frappe.db.get_value("Mould", d.asset, "location")
			if d.source_location:
				if current_location != d.source_location:
					frappe.throw(
						_("Mould {0} does not belong to the location {1}").format(d.asset, d.source_location)
					)
			else:
				d.source_location = current_location
			if not d.target_location:
				frappe.throw(_("Target Location is required for transferring Mould {0}").format(d.asset))
			if d.source_location == d.target_location:
				frappe.throw(_("Source and Target Location cannot be same"))

		if self.purpose == "Receipt":
			if not d.target_location:
				frappe.throw(_("Target Location is required while receiving Mould {0}").format(d.asset))
			if d.to_employee and frappe.db.get_value("Employee", d.to_employee, "company") != self.company:
				frappe.throw(
					_("Employee {0} does not belong to the company {1}").format(d.to_employee, self.company)
				)

	def validate_employee(self, d):
		if self.purpose == "Transfer and Issue":
			if not d.from_employee:
				frappe.throw(_("From Employee is required while issuing Mould {0}").format(d.asset))

		if d.from_employee:
			current_custodian = frappe.db.get_value("Mould", d.asset, "custodian")

			if current_custodian != d.from_employee:
				frappe.throw(
					_("Mould {0} does not belong to the custodian {1}").format(d.asset, d.from_employee)
				)

		if not d.to_employee:
			frappe.throw(_("Employee is required while issuing Mould {0}").format(d.asset))

		if d.to_employee and frappe.db.get_value("Employee", d.to_employee, "company") != self.company:
			frappe.throw(
				_("Employee {0} does not belong to the company {1}").format(d.to_employee, self.company)
			)

	def on_submit(self):
		self.set_latest_location_and_custodian_in_asset()

	def on_cancel(self):
		self.set_latest_location_and_custodian_in_asset()

	def set_latest_location_and_custodian_in_asset(self):
		for d in self.assets:
			current_location, current_employee = self.get_latest_location_and_custodian(d.asset)
			self.update_asset_location_and_custodian(d.asset, current_location, current_employee)
			# self.log_asset_activity(d.asset, current_location, current_employee)

	def get_latest_location_and_custodian(self, asset):
		current_location, current_employee = "", ""
		args = {"asset": asset, "company": self.company}
		latest_movement_entry = frappe.db.sql(
			"""
			SELECT asm_item.target_location, asm_item.to_employee
			FROM `tabMould Movement Item` asm_item
			JOIN `tabMould Movement` asm ON asm_item.parent = asm.name
			WHERE
				asm_item.asset = %(asset)s AND
				asm.company = %(company)s AND
				asm.docstatus = 1
			ORDER BY asm.transaction_date DESC
			LIMIT 1
			""",
			args,
		)

		if latest_movement_entry:
			current_location = latest_movement_entry[0][0]
			current_employee = latest_movement_entry[0][1]

		return current_location, current_employee

	def update_asset_location_and_custodian(self, asset_id, location, employee):
		asset = frappe.get_doc("Mould", asset_id)

		if cstr(employee) != asset.custodian:
			frappe.db.set_value("Mould", asset_id, "custodian", cstr(employee))
		if location and location != asset.location:
			frappe.db.set_value("Mould", asset_id, "location", location)

	# def log_asset_activity(self, asset_id, location, employee):
	# 	if location and employee:
	# 		add_asset_activity(
	# 			asset_id,
	# 			_("Mould received at Location {0} and issued to Employee {1}").format(
	# 				get_link_to_form("Location", location),
	# 				get_link_to_form("Employee", employee),
	# 			),
	# 		)
	# 	elif location:
	# 		add_asset_activity(
	# 			asset_id,
	# 			_("Mould transferred to Location {0}").format(get_link_to_form("Location", location)),
	# 		)
	# 	elif employee:
	# 		add_asset_activity(
	# 			asset_id,
	# 			_("Mould issued to Employee {0}").format(get_link_to_form("Employee", employee)),
	# 		)
