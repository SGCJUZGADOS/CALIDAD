// USER MANAGEMENT MODULE
// Handles Create, Edit, List, and Delete operations

window.handleCreateUser = function (e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.toLowerCase().trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    let juzgado = document.getElementById('newJuzgado').value;
    const email = document.getElementById('newEmail').value.trim();
    const hasVacancia = document.getElementById('newVacancia').checked;

    // Check Mode
    const form = document.getElementById('userForm');
    const mode = form.dataset.mode || 'create';

    if (role === 'admin') juzgado = 'Todos';
    if (!username || !password) return;

    if (mode === 'edit') {
        // UPDATE LOGIC
        db.collection("users").doc(username).update({
            password,
            role,
            juzgado,
            email,
            hasVacancia,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("✅ Usuario actualizado exitosamente");
            resetUserForm();
        }).catch((error) => {
            alert("Error actualizando usuario: " + error.message);
        });
    } else {
        // CREATE LOGIC
        db.collection("users").doc(username).set({
            username,
            password,
            role,
            juzgado,
            email,
            hasVacancia,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("✅ Usuario creado exitosamente");
            resetUserForm();
        }).catch((error) => {
            alert("Error creando usuario: " + error.message);
        });
    }
}

window.resetUserForm = function () {
    const form = document.getElementById('userForm');
    if (!form) return;
    form.reset();
    form.dataset.mode = 'create';
    document.getElementById('newUsername').disabled = false;
    document.getElementById('newEmail').value = '';
    document.getElementById('userFormTitle').innerText = "Crear Nuevo Usuario";

    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
        btn.innerText = "Guardar Usuario";
        btn.classList.remove('btn-warning', 'btn-danger');
        btn.classList.add('btn-primary');
    }

    const cancelBtn = document.getElementById('btnCancelUserEdit');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

window.editUser = function (id) {
    console.log("Editing user:", id);
    db.collection("users").doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('newUsername').value = data.username;
            document.getElementById('newUsername').disabled = true; // LOCK ID
            document.getElementById('newPassword').value = data.password;
            document.getElementById('newRole').value = data.role;
            document.getElementById('newJuzgado').value = data.juzgado || '';
            document.getElementById('newEmail').value = data.email || '';
            document.getElementById('newVacancia').checked = data.hasVacancia || false;

            document.getElementById('userFormTitle').innerText = "Editando Usuario: " + data.username;

            // UI Switch to Edit Mode
            const form = document.getElementById('userForm');
            if (form) {
                form.dataset.mode = 'edit';
                const btn = form.querySelector('button[type="submit"]');
                if (btn) {
                    btn.innerText = "ACTUALIZAR USUARIO";
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-warning');
                }
            }

            const cancelBtn = document.getElementById('btnCancelUserEdit');
            if (cancelBtn) cancelBtn.style.display = 'block';

            if (typeof toggleJuzgadoInput === 'function') {
                toggleJuzgadoInput();
            }

            // Scroll to form (top of section)
            const section = document.getElementById('user-management-section');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

window.renderUserList = function () {
    db.collection("users").onSnapshot((snapshot) => {
        const tbody = document.getElementById('userListBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        snapshot.forEach((doc) => {
            const user = doc.data();
            const vacanciaLabel = user.hasVacancia ? '<span class="badge badge-success">SÍ</span>' : '<span class="badge badge-secondary" style="background:#6c757d">NO</span>';
            const roleLabel = (user.role === 'admin') ? '<span class="badge badge-primary">Admin</span>' :
                (user.role.startsWith('radicador') ? '<span class="badge badge-info" style="background:#17a2b8">Radicador</span>' : 'Juzgado');

            tbody.innerHTML += `
            <tr>
                <td style="font-weight:bold; color:#1e293b;">${user.username}</td>
                <td>${roleLabel}</td>
                <td style="color:#475569;">${user.juzgado || '---'}</td>
                <td style="color:#475569; font-size: 0.85rem;">${user.email || '<i style="color:#999">Sin correo</i>'}</td>
                <td>${vacanciaLabel}</td>
                <td style="white-space: nowrap;">
                    <button class="btn-sm" onclick="window.editUser('${doc.id}')" title="Editar Usuario" 
                        style="width: 32px; height: 32px; padding: 0; border:none; border-radius:4px; cursor:pointer; background-color: #007bff; display: inline-flex; align-items: center; justify-content: center; margin-right: 5px;">
                        <i class="fas fa-edit" style="color: white; font-size: 14px;"></i>
                    </button>
                    <button class="btn-sm" onclick="window.deleteUser('${doc.id}')" title="Borrar Usuario"
                        style="width: 32px; height: 32px; padding: 0; border:none; border-radius:4px; cursor:pointer; background-color: #dc3545; display: inline-flex; align-items: center; justify-content: center;">
                        <i class="fas fa-trash" style="color: white; font-size: 14px;"></i>
                    </button>
                </td>
            </tr>
            `;
        });
    });
}

window.deleteUser = function (id) {
    if (confirm("¿Borrar usuario?")) {
        db.collection("users").doc(id).delete();
    }
}
