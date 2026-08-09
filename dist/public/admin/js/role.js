// Permission for role
const tablePermissions = document.querySelector("[table-permissions]");
if (tablePermissions) {
    const btnSubmit = document.querySelector("[button-submit]");
    btnSubmit.addEventListener("click", async () => {
        const row = tablePermissions.querySelectorAll("[data-name]");
        let permissions = [];
        row.forEach((item) => {
            const name = item.getAttribute("data-name");
            const inputPermissions = item.querySelectorAll("input");

            if (name === "id") {
                inputPermissions.forEach((input) => {
                    const roleId = input.value;
                    const permission = {
                        id: roleId,
                        permissions: []
                    }
                    permissions.push(permission);
                })
            }
            else {
                inputPermissions.forEach((item, index) => {
                    const checked = item.checked;
                    // console.log(name)
                    // console.log(index)
                    // console.log(checked)
                    // console.log('-----------------')
                    if (checked) {
                        permissions[index].permissions.push(name);
                    }
                })
            }
        })
        axios.patch("/admin/roles/permissions?_method=PATCH", { permissions })
            .then((res) => {
                console.log("Cập nhật thành công:", res.data);
            })
            .catch((err) => {
                console.error("Có lỗi khi cập nhật:", err);
            });

    })
}
// End permission for role

//Permission default data
const dataRecords = document.querySelector('[data-records]');
if (dataRecords) {
    const records = JSON.parse(dataRecords.getAttribute('data-records'))

    const tablePermission = document.querySelector('[table-permissions]')

    records.forEach((item, index) => {
        const permissions = item.permissions

        permissions.forEach(permission => {
            const row = tablePermission.querySelector(`[data-name="${permission}"]`)
            const input = row.querySelectorAll("input")[index];
            input.checked = true;
        })
    })
}
//End permission default data  