frappe.pages['daily-production-rep'].on_page_load = function (wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Daily Production Report',
        single_column: true
    });

    let currentIndex = 0;
    let records = [];

    const container = $(`<div class="daily-production-report-container"></div>`);
    const nav = $(`
        <div class="pagination-controls" style="margin: 10px 0; text-align: center;">
            <button class="btn btn-default prev-btn" disabled>Previous</button>
            <span class="page-info" style="margin: 0 15px;"></span>
            <button class="btn btn-default next-btn" disabled>Next</button>
        </div>
    `);

    $(page.body).append(container);
    $(page.body).append(nav);

    function renderPage(index) {
        if (records.length === 0) {
            container.html("<p>No records found.</p>");
            return;
        }

        const doc = records[index];

        // Build HTML for each record
        const html = `
            <style>
                h3 { margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                table, th, td { border: 1px solid #ccc; }
                th, td { padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .section-title { background-color: #e6f2ff; font-weight: bold; text-align: left; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .header-table td { border: none; background-color: #fff; }
                .header-table { border: none; margin-bottom: 10px; }
                ul { padding: 0; margin: 0; list-style: none; text-align: left; }
            </style>

            <!-- Header -->
            <table class="header-table">
                <tr>
                    <td colspan="2"><strong>${doc.company || ""}</strong></td>
                    <td colspan="5" style="text-align:center;"><h3>Daily Production Report</h3></td>
                    <td colspan="2">
                        <ul>
                            <li>Doc No: ${doc.doc_no || ""}</li>
                            <li>Rev No: ${doc.rev_no || ""}</li>
                            <li>Page: ${index + 1}</li>
                        </ul>
                    </td>
                </tr>
            </table>

            <!-- Shift Details -->
            <table>
                <tr>
                    <td class="section-title">Shift Details</td><td>${doc.shift || ""}</td>
                    <td class="section-title">Date</td><td>${doc.report_date || ""}</td>
                    <td class="section-title">Machine No</td><td>${doc.machine_no || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">Product Name</td><td colspan="2">${doc.product_name || ""}</td>
                    <td class="section-title">Operator Name</td><td colspan="2">${doc.operator_name || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">Shot Weight</td><td>${doc.shot_weight || ""}</td>
                    <td class="section-title">Runner Weight</td><td>${doc.runner_weight || ""}</td>
                    <td class="section-title">Item Code No</td><td>${doc.item_code || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">Raw Material</td><td>${doc.raw_material || ""}</td>
                    <td class="section-title">Grade</td><td>${doc.grade || ""}</td>
                    <td class="section-title">Batch No</td><td>${doc.batch_no || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">Masterbatch</td><td>${doc.masterbatch || ""}</td>
                    <td class="section-title">Grade</td><td>${doc.mb_grade || ""}</td>
                    <td class="section-title">Batch No</td><td>${doc.mb_batch_no || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">First Counter</td><td>${doc.first_counter || ""}</td>
                    <td class="section-title">Cycle Time</td><td>${doc.cycle_time || ""}</td>
                    <td class="section-title">Shift Target</td><td>${doc.shift_target || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">Total No Cavity</td><td>${doc.total_cavity || ""}</td>
                    <td class="section-title">Running Cavity</td><td>${doc.running_cavity || ""}</td>
                    <td class="section-title">Anti Static</td><td>${doc.anti_static || ""}</td>
                </tr>
            </table>

            <!-- Production Data -->
            <table>
                <tr>
                    <th>Time</th>
                    <th>OK Shots</th>
                    <th>Rej Shots</th>
                    <th>Total Shots</th>
                    <th>Rej Code</th>
                    <th>Remarks</th>
                </tr>
                ${(doc.production_data || []).map(row => `
                    <tr>
                        <td>1 ${row.time_slot || ""}</td>
                        <td>2 ${row.ok_shots || ""}</td>
                        <td>3 ${row.rej_shots || ""}</td>
                        <td>4 ${row.total_shots || ""}</td>
                        <td>5 ${row.rej_code || ""}</td>
                        <td>6 ${row.remarks || ""}</td>
                    </tr>
                `).join("")}
                
            </table>

            <!-- Summary -->
            <table>
                <tr>
                    <td class="section-title">Last Counter</td><td>${doc.last_counter || ""}</td>
                    <td class="section-title">OK Shots</td><td>${doc.ok_shots || ""}</td>
                    <td class="section-title">Rej Shots</td><td>${doc.rej_shots || ""}</td>
                    <td class="section-title">Total Shots</td><td>${doc.total_shots || ""}</td>
                </tr>
                <tr>
                    <td class="section-title">RM Consumption</td><td>${doc.rm_consumption || ""}</td>
                    <td class="section-title">Lumps</td><td>${doc.lumps || ""}</td>
                    <td class="section-title">Supervisor Sign</td><td colspan="3">${doc.supervisor_sign || ""}</td>
                </tr>
            </table>
        `;

        container.html(html);

        // Update nav
        $(".page-info").text(`Page ${index + 1} of ${records.length}`);
        $(".prev-btn").prop("disabled", index === 0);
        $(".next-btn").prop("disabled", index === records.length - 1);
    }

    // Fetch Data from Doctype
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Daily Production Log",
            fields: ["*"],   // fetch all fields
            limit_page_length: 50
        },
        callback: function (r) {
            if (r.message) {
                records = r.message;
                renderPage(currentIndex);
            }
        }
    });

    // Pagination controls
    nav.find(".prev-btn").on("click", function () {
        if (currentIndex > 0) {
            currentIndex--;
            renderPage(currentIndex);
        }
    });

    nav.find(".next-btn").on("click", function () {
        if (currentIndex < records.length - 1) {
            currentIndex++;
            renderPage(currentIndex);
        }
    });
};
