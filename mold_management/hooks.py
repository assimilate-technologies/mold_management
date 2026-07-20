app_name = "mold_management"
app_title = "Mould Management"
app_publisher = "Assimilate Technologies"
app_description = "For Mould Managment "
app_email = "info@assimilatetechnologies.com"
app_license = "mit"


after_migrate = [
     "mold_management.patches.v0_1.add_naming_series_for_mould.execute",
     "mold_management.patches.v0_1.add_mould_create_checkbox_field_on_work_order.execute",
     "mold_management.patches.v0_1.create_fields_on_quotation_item_table.execute",
     "mold_management.patches.v0_1.create_fields_on_sales_order_item.execute",
     "mold_management.patches.v0_1.create_mould_field_on_job_card.execute",
     "mold_management.patches.v0_1.create_field_is_mold_checkbox_on_jobcard.execute",
     "mold_management.patches.v0_1.add_email_sent_90_field_on_mould.execute",
     "mold_management.patches.v0_1.add_fields_on_work_order_item_table.execute",
     "mold_management.patches.v0_1.create_moulds_field_on_bom_item_table.execute",
     "mold_management.patches.v0_1.create_mould_fields_on_work_order.execute",
     "mold_management.patches.v0_1.create_notification_on_mould_for_next_maintenance_date.execute",
     "mold_management.patches.v0_1.create_tool_room_work_order_field_on_stock_entry.execute",
     "mold_management.patches.v0_1.create_mould_fields_on_tool_room_work_order.execute",
     "mold_management.patches.v0_1.create_tool_room_work_order_on_job_card.execute",
     "mold_management.patches.v0_1.create_tool_room_work_order_on_pick_list.execute",
     "mold_management.patches.v0_1.create_tool_room_work_order_on_serial_no.execute",
     "mold_management.patches.v0_1.create_tool_room_work_order_on_material_request.execute",
     "mold_management.patches.v0_1.create_is_customer_and_maintain_stock_fixed_asset_on_work_order.execute",
     "mold_management.patches.v0_1.add_work_order_routing_field_on_work_order.execute",
    "mold_management.patches.v0_1.add_is_moulding_machine_field_on_workstation_type.execute",
    "mold_management.patches.v0_1.add_belongs_to_field_on_workstation.execute",
    "mold_management.patches.v0_1.add_belongs_to_field_on_operations.execute",

     # fields and section on item doctype
     "mold_management.patches.v0_1.add_mould_detail_tab_on_item_master.execute",
    #  "mold_management.patches.v0_1.add_selection_of_tool_on_item.execute",
    #  "mold_management.patches.v0_1.add_moulds_field_on_item.execute",
    #  "mold_management.patches.v0_1.add_mould_name_field_on_item.execute",
     "mold_management.patches.v0_1.add_packing_details_tab_on_item.execute",
     "mold_management.patches.v0_1.add_part_specification_tab_on_item.execute",
     "mold_management.patches.v0_1.add_rework_and_checking_details.execute",

     "mold_management.patches.v0_1.add_is_mold_item_field_on_item.execute",
     "mold_management.patches.v0_1.add_other_than_mould_or_moulding_item.execute",
     "mold_management.patches.v0_1.add_is_moulding_item_checkbox_on_item.execute",
     "mold_management.patches.v0_1.add_mould_in_workorder.execute"

]


doctype_js = {
    "Mould":["public/js/fetcehd_id_in_mould_code_field.js","public/js/add_manage_button_on_mould.js"],
    "Item": ["public/js/fetched_cavity_from_mould_on_item.js","public/js/if_fixed_asset_hide_customer_provided_item_checkbox.js","public/js/atleast one of the mould checkbox is checked.js","public/js/is_mold_and_is_molding_show_hide_mandatory_mold_details_tab_fiedls.js"],
    # "Work Order": "public/js/auto_mold_generation_based_on_work_order.js",
    "Job Card": ["public/js/mould_filter_applied_on_job_card.js","public/js/on_job_card_is_mold_checkbox_checked_then_mandatory_mould_field.js", "public/js/daily_production_log_button.js"],
    "Mould Maintenance Order": ["public/js/create_material_request_and_purchase_order_from_maintenance_order.js","public/js/on_mould_maintenance_order_fetched_total_shot_current_maximum.js"],
    "Mould Maintenance": ["public/js/calculate_amount_in_require_part_table.js","public/js/supplier_mandatory_when_maintenance_team_outsource.js","public/js/on_mould_maintenance_fetched_total_shot_current_maximum.js"],
    "Work Order": ["public/js/on_work_order_allow_non_stock_item.js","public/js/work_order_routing_template.js", "public/js/daily_production_log_button.js"],
    "Stock Entry": ["public/js/on_stock_entry_fetched_work_order_item.js", "public/js/stock_entry_non_tock_items_allow.js"],
"Work Order":"public/js/add_filter_for_mould_field_in_workorder.js"

}


scheduler_events = {
    "daily": [
        "mold_management.mold_management.doctype.mould_maintenance_order.mould_maintenance_order.update_mould_maintenance_order_status",
    ],

}

doc_events = {
   "Job Card": {
        "on_submit": "mold_management.api.mould_shots_updated_on_jo_card_completed_qty.update_mould_usage"
    },
    "Mould": {
        "on_update": "mold_management.api.if_current_usage_count_reach_90_trigger_notification.check_mould_usage"
    },

    # "Mould Maintenance": {
    #     "on_update": "mold_management.api.update_last_maintenence_date_and_next_maintenance_date.update_mould_dates_from_maintenance"
    # },

    "Stock Entry": {
        "on_submit": ["mold_management.api.mould_record_generation_on_stock_entry.create_mould_on_stock_entry",
                      "mold_management.api.allow_non_stock_item_in_stock_entry.check_non_stock_items"
        ]
    },

    "Mould Maintenance Order": {
        "on_update": "mold_management.api.reset_current_shot_zero.reset_mould_usage_on_submit"
    },

    # "Stock Entry": {
    #     "on_submit": [
    #         "mold_management.api.mould_record_generation_on_stock_entry.create_mould_on_stock_entry",
    #         # "mold_management.api.create_asset_on_stock_entry_submit.create_pr_and_asset_from_stock_entry"
    #     ]
    # }

}

override_doctype_class = {
    "Stock Entry": "mold_management.overrides.non_stock_item_stock_entry.CustomStockEntry"
}
