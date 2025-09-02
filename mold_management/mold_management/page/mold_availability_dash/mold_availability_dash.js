frappe.pages['mould-availability-dash'].on_page_load = async function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Mould Availability Dashboard',
        single_column: true,
    });

    page.set_title(__('Mould Availability Dashboard'));

    // Filters
    const filters_wrapper = $('<div class="mx-4 flex flex-wrap gap-4 mb-4"></div>').appendTo(page.body);
    const filters = {
        date_range: frappe.ui.form.make_control({
            parent: filters_wrapper,
            df: {
                label: 'Date Range',
                fieldtype: 'DateRange',
                fieldname: 'date_range'
            },
            render_input: true
        }),
        mould_type: frappe.ui.form.make_control({
            parent: filters_wrapper,
            df: {
                label: 'Mould Type',
                fieldtype: 'Link',
                options: 'Mould Type',
                fieldname: 'mould_type'
            },
            render_input: true
        }),
        mould: frappe.ui.form.make_control({
            parent: filters_wrapper,
            df: {
                label: 'Mould',
                fieldtype: 'Link',
                options: 'Mould',
                fieldname: 'mould'
            },
            render_input: true
        }),
        status: frappe.ui.form.make_control({
            parent: filters_wrapper,
            df: {
                label: 'Status',
                fieldtype: 'Select',
                options: ['All', 'Available', 'In Use', 'Under Maintenance', 'Planned', 'Scrapped', 'Idle'].join('\n'),
                fieldname: 'status'
            },
            render_input: true
        }),
    };

    // Cards wrapper
    const cards_wrapper = $('<div class="mx-5 flex flex-wrap gap-4 mb-3"></div>').appendTo(page.body);

    // Two-column layout
    const two_col_wrapper = $(`<div class="m-4 row"></div>`).appendTo(page.body);
    const left_col = $(`<div class="cal-2 m-1"></div>`).appendTo(two_col_wrapper);
    const right_col = $(`<div class="cal-2 m-1"></div>`).appendTo(two_col_wrapper);

    // mould Table
    const mould_table = $(`<div class="card p-4 mb-2 bg-white dark:bg-gray-900 rounded shadow-md">
        <h4 class="text-lg font-semibold mb-2">Mould Status Table</h4>
        <table class="table table-bordered w-full">
            <thead>
                <tr>
                    <th>Mould No</th>
                    <th>Mould Name</th>
                    <th>Status</th>
                    <th>Mould Type</th>
                    <th>Location</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>`).appendTo(left_col);

    // Refresh table + cards
    async function refresh_table() {
        let filters_obj = {}; 

        if (filters.mould_type.get_value()) {
            filters_obj.mould_type = filters.mould_type.get_value();
        }
        if (filters.mould.get_value()) {
            filters_obj.name = filters.mould.get_value();
        }
        if (filters.status.get_value() && filters.status.get_value() !== 'All') {
            filters_obj.status = filters.status.get_value();
        }
        if (filters.date_range.get_value()) {
            const [from_date, to_date] = filters.date_range.get_value();
            if (from_date && to_date) {
                filters_obj.last_maintenance_date = ['between', [from_date, to_date]];
            }
        }

        const mould_data = await frappe.db.get_list('Mould', {
            filters: filters_obj,
            fields: ['name', 'mould_no', 'mould_name', 'mould_type', 'status', 'location'],
            limit: 1000
        });

        // update cards
        cards_wrapper.empty();

        if (!mould_data.length) {
            cards_wrapper.append(`<div class="text-gray-500">No moulds found with current filters.</div>`);
        } else {
            const counts = mould_data.reduce((acc, mould) => {
                acc.total++;
                acc[mould.status] = (acc[mould.status] || 0) + 1;
                return acc;
            }, { total: 0 });

            const card_definitions = [
                { status: null, title: 'Total moulds', count: counts.total },
                { status: 'Available', title: 'moulds Available', count: counts['Available'] || 0 },
                { status: 'In Use', title: 'moulds In Use', count: counts['In Use'] || 0 },
                { status: 'Planned', title: 'moulds Planned', count: counts['Planned'] || 0 },
                { status: 'Idle', title: 'moulds Idle', count: counts['Idle'] || 0 },
                { status: 'Scrapped', title: 'moulds Scrapped', count: counts['Scrapped'] || 0 },
                { status: 'Under Maintenance', title: 'moulds Under Maintenance', count: counts['Under Maintenance'] || 0 }
            ];

            card_definitions.forEach(card => {
                if (card.count > 0 || card.status === null) {
                    $(`<div class="card p-3 m-2 bg-white dark:bg-gray-900 rounded shadow-sm min-w-[200px]">
                        <h4 class="text-gray-600">${card.title}</h4>
                        <div class="text-lg font-bold text-center">${card.count}</div>
                    </div>`).appendTo(cards_wrapper);
                }
            });
        }

        // update table
        const tbody = mould_table.find('tbody');
        tbody.empty();

        if (!mould_data.length) {
            tbody.append('<tr><td colspan="5" class="text-center text-gray-500">No moulds found.</td></tr>');
            return;
        }

        const mouldTypeCache = {};
        const getmouldTypeName = async (mould_type) => {
            if (!mould_type) return '';
            if (mouldTypeCache[mould_type]) return mouldTypeCache[mould_type];
            try {
                const doc = await frappe.db.get_doc('mould Type', mould_type);
                mouldTypeCache[mould_type] = doc.mould_type_name;
                return doc.mould_type_name;
            } catch {
                mouldTypeCache[mould_type] = '';
                return '';
            }
        };

        const mouldTypeNames = await Promise.all(
            mould_data.map(mould => getmouldTypeName(mould.mould_type))
        );

        mould_data.forEach((mould, index) => {
            const mould_type_name = mouldTypeNames[index] || '';
            tbody.append(`
                <tr>
                    <td>${mould.mould_no}</td>
                    <td>${mould.mould_name || ''}</td>
                    <td><span class="badge ${mould.status === 'Available' ? 'badge-success' : 'badge-danger'}">${mould.status}</span></td>
                    <td>${mould_type_name || ''}</td>
                    <td>${mould.location || ''}</td>
                </tr>
            `);
        });
    }

    // Maintenance Alerts
    const maintenance_table = $(`<div class="card p-4 bg-white dark:bg-gray-900 rounded shadow-md">
        <h4 class="text-lg font-semibold mb-2">Maintenance and Cleaning Alerts</h4>
        <table class="table table-bordered w-full">
            <thead>
                <tr>
                    <th>mould</th>
                    <th>Last Used</th>
                    <th>Next Maintenance</th>
                    <th>Current Usage Count</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>`).appendTo(left_col);

    const alerts = await frappe.db.get_list('mould', {
        fields: ['mould_name', 'last_maintenance_date', 'next_maintenance_due', 'current_usage_count'],
        limit: 10
    });

    alerts.forEach(row => {
        maintenance_table.find('tbody').append(`
            <tr>
                <td>${row.mould_name || ''}</td>
                <td>${row.last_maintenance_date || ''}</td>
                <td>${row.next_maintenance_due || ''}</td>
                <td>${row.current_usage_count || ''}</td>
                <td>
                    <button class="btn btn-xs btn-primary schedule-btn" data-mould-name="${row.mould_name}">
                        Schedule
                    </button>
                </td>
            </tr>
        `);
    });

    maintenance_table.find('.schedule-btn').on('click', function () {
        const mouldName = $(this).data('mould-name');

        frappe.call({
            method: "frappe.client.insert",
            args: {
                doc: {
                    doctype: "mould Maintenance",
                    mould_name: mouldName
                }
            },
            callback: function (r) {
                if (r.message) {
                    frappe.msgprint(`mould Maintenance created for ${mouldName}`);
                    frappe.set_route("Form", "mould Maintenance", r.message.name);
                }
            }
        });
    });

    // Quick Actions
    const quick_actions = $(`<div class="card p-4 bg-white dark:bg-gray-800 rounded shadow-md">
        <h4 class="text-lg font-semibold mb-2">Quick Actions</h4>
        <ul class="space-y-2">
            <li><a class="text-blue-600 hover:underline" href="mould/new-mould-zkkmvibbqa"><i class="fa fa-plus-circle"></i> Add New mould</a></li>
            <li><a class="text-blue-600 hover:underline" href="mould-maintenance/new-mould-maintenance-zkkmvibbqa"><i class="fa fa-calendar"></i> Schedule Maintenance</a></li>
            <li><a class="text-blue-600 hover:underline" href="mould"><i class="fa fa-chart-line"></i> mould Performance Report</a></li>
            <li><a class="text-blue-600 hover:underline" href="mould"><i class="fa fa-broom"></i> Request Cleaning</a></li>
        </ul>
    </div>`).appendTo(right_col);

    // Initial load
    await refresh_table();

    // Refresh table on filter change
    Object.values(filters).forEach(control => {
        control.$input.on('change', refresh_table);
    });

    page.add_inner_button('Refresh Table', refresh_table);
};
