document.addEventListener('DOMContentLoaded', () => {
    console.log('El archivo scripts.js se está ejecutando.');
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('El archivo scripts.js se está ejecutando.');

    // Registrar un ingreso
    const formIngreso = document.getElementById('form-ingreso');
    const mensaje = document.getElementById('mensaje');
    const submitButton = formIngreso.querySelector('button[type="submit"]');

    // Variable para evitar múltiples envíos
    let isSubmitting = false;

    // Asegúrate de que el evento se registre solo una vez
    if (!formIngreso.dataset.listenerAdded) {
        formIngreso.dataset.listenerAdded = true; // Marca que el evento ya fue registrado

        formIngreso.addEventListener('submit', async (event) => {
            event.preventDefault(); // Evitar el comportamiento predeterminado del formulario

            // Evitar múltiples envíos
            if (isSubmitting) return;
            isSubmitting = true;
            submitButton.disabled = true; // Deshabilitar el botón de envío

            const formData = new FormData(formIngreso);

            try {
                const response = await fetch('/api/ingresos', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    mensaje.textContent = result.message;
                    mensaje.style.color = 'green';
                    formIngreso.reset(); // Limpiar el formulario después de un envío exitoso
                    cargarIngresos(); // Recargar la tabla de ingresos
                } else {
                    const error = await response.json();
                    mensaje.textContent = error.error || 'Error al registrar el ingreso';
                    mensaje.style.color = 'red';
                }
            } catch (error) {
                mensaje.textContent = 'Error de conexión con el servidor';
                mensaje.style.color = 'red';
            } finally {
                isSubmitting = false; // Permitir nuevos envíos después de completar
                submitButton.disabled = false; // Habilitar el botón de envío
            }
        });
    }

    // Registrar una cita
    const formCita = document.getElementById('form-cita');
    if (formCita) {
        formCita.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = document.getElementById('nombre')?.value.trim();
            const servicio = document.getElementById('servicio')?.value.trim();
            const fecha = document.getElementById('fecha')?.value.trim();
            const hora = document.getElementById('hora')?.value.trim();

            if (!nombre || !servicio || !fecha || !hora) {
                mostrarModal('<p>Todos los campos son obligatorios.</p><button onclick="cerrarModal()">Cerrar</button>');
                return;
            }

            try {
                const response = await fetch('/api/citas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, servicio, fecha, hora })
                });

                if (response.ok) {
                    mostrarModal('<p>Cita registrada correctamente.</p><button onclick="cerrarModal()">Cerrar</button>');
                    formCita.reset();
                    cargarCitas(); // Recargar la tabla de citas
                } else {
                    const error = await response.json();
                    mostrarModal(`<p>Error al registrar la cita: ${error.error || 'Error desconocido.'}</p><button onclick="cerrarModal()">Cerrar</button>`);
                }
            } catch (error) {
                console.error('Error al registrar la cita:', error);
                mostrarModal('<p>Error al conectar con el servidor.</p><button onclick="cerrarModal()">Cerrar</button>');
            }
        });
    }

    // Función para cargar ingresos
    async function cargarIngresos(filtros = {}) {
        const resultadosTabla = document.getElementById('resultadosTabla');
        if (!resultadosTabla) {
            console.error('Error: No se encontró el elemento <tbody> con el ID "resultadosTabla".');
            return;
        }

        resultadosTabla.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

        try {
            const params = new URLSearchParams(filtros).toString(); // Convertir los filtros en parámetros de consulta
            const response = await fetch(`/api/ingresos?${params}`); // Enviar los filtros al servidor
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al obtener los ingresos.');
            }

            const ingresos = await response.json();

            if (ingresos.length === 0) {
                resultadosTabla.innerHTML = '<tr><td colspan="8">No se encontraron resultados.</td></tr>';
            } else {
                ingresos.forEach((ingreso) => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${ingreso.nombre}</td>
                        <td>$${parseFloat(ingreso.monto).toFixed(2)}</td>
                        <td>${ingreso.realizado}</td>
                        <td>${ingreso.quien}</td>
                        <td>${ingreso.seRealizo}</td>
                        <td>$${(ingreso.monto * 0.4).toFixed(2)}</td>
                        <td>
                            <button onclick="editarIngreso(${ingreso.id})">Editar</button>
                            <button onclick="eliminarIngreso(${ingreso.id})">Eliminar</button>
                        </td>
                    `;
                    resultadosTabla.appendChild(fila);
                });
            }
        } catch (error) {
            console.error('Error al cargar los ingresos:', error);
            resultadosTabla.innerHTML = '<tr><td colspan="8">Error al cargar los datos.</td></tr>';
        }
    }

    cargarIngresos();

    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Evitar el comportamiento predeterminado del formulario

            const fechaInicio = document.getElementById('fechaInicio').value; // Obtener la fecha de inicio
            const fechaFin = document.getElementById('fechaFin').value; // Obtener la fecha de fin

            // Validar que las fechas sean correctas
            if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
                alert('La fecha de inicio no puede ser mayor que la fecha de fin.');
                return;
            }

            // Llamar a la función cargarIngresos con los filtros de fecha
            cargarIngresos({ fechaInicio, fechaFin });
        });
    }

    // Verifica si estamos en la página de estadísticas
    if (document.getElementById('graficoSemanal')) {
        inicializarEstadisticas();
    }

    const graficoSemanalCanvas = document.getElementById('graficoSemanal');
    if (!graficoSemanalCanvas) {
        console.error('No se encontró el elemento <canvas> para el gráfico.');
        return;
    }

    async function obtenerEstadisticas() {
        try {
            const response = await fetch('/api/estadisticas');
            if (!response.ok) {
                throw new Error('Error al obtener las estadísticas.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return null;
        }
    }

    function actualizarGraficos(estadisticas) {
        if (!estadisticas || estadisticas.porDia.length === 0) {
            console.error('No hay datos para mostrar en el gráfico.');
            const container = document.querySelector('.floating-box');
            container.innerHTML = '<p>No hay datos disponibles para las estadísticas semanales.</p>';
            return;
        }

        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const ingresosPorDia = Array(7).fill(0);

        estadisticas.porDia.forEach((item) => {
            const diaIndex = parseInt(item.dia);
            if (!isNaN(diaIndex) && diaIndex >= 0 && diaIndex < 7) {
                ingresosPorDia[diaIndex] = item.total;
            }
        });

        const ctxSemanal = graficoSemanalCanvas.getContext('2d');
        new Chart(ctxSemanal, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Ingresos por Día',
                    data: ingresosPorDia,
                    backgroundColor: 'rgba(166, 123, 91, 0.2)',
                    borderColor: 'rgba(166, 123, 91, 1)',
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });
    }

    const estadisticas = await obtenerEstadisticas();
    if (estadisticas) {
        actualizarGraficos(estadisticas);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('El archivo scripts.js se está ejecutando.');

    const graficoSemanalCanvas = document.getElementById('graficoSemanal');
    if (!graficoSemanalCanvas) {
        console.error('No se encontró el elemento <canvas> para el gráfico.');
        return;
    }

    async function obtenerEstadisticas() {
        try {
            const response = await fetch('/api/estadisticas');
            if (!response.ok) {
                throw new Error('Error al obtener las estadísticas.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            const container = document.querySelector('.floating-box');
            if (container) {
                container.innerHTML = '<p style="color: red; text-align: center;">Error al cargar las estadísticas. Inténtalo más tarde.</p>';
            }
            return null;
        }
    }

    function actualizarGraficos(estadisticas) {
        if (!estadisticas || !estadisticas.porDia || estadisticas.porDia.length === 0) {
            console.error('No hay datos para mostrar en el gráfico.');
            const container = document.querySelector('.floating-box');
            container.innerHTML = '<p>No hay datos disponibles para las estadísticas semanales.</p>';
            return;
        }

        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const ingresosPorDia = Array(7).fill(0);

        estadisticas.porDia.forEach((item) => {
            const diaIndex = parseInt(item.dia, 10);
            if (!isNaN(diaIndex) && diaIndex >= 0 && diaIndex < 7) {
                ingresosPorDia[diaIndex] = parseFloat(item.total); // Asegúrate de que sea un número
            }
        });

        const ctxSemanal = graficoSemanalCanvas.getContext('2d');
        new Chart(ctxSemanal, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Ingresos por Día',
                    data: ingresosPorDia,
                    backgroundColor: 'rgba(166, 123, 91, 0.2)',
                    borderColor: 'rgba(166, 123, 91, 1)',
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });
    }

    const estadisticas = await obtenerEstadisticas();
    if (estadisticas) {
        actualizarGraficos(estadisticas);
    }
});

// Función para mostrar mensajes en la interfaz
function mostrarMensaje(mensaje, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    if (!mensajeDiv) {
        console.error('Error: No se encontró el elemento para mostrar mensajes.');
        return;
    }

    mensajeDiv.textContent = mensaje;
    mensajeDiv.className = tipo === 'success' ? 'mensaje-exito' : 'mensaje-error';
    mensajeDiv.style.display = 'block';

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        mensajeDiv.style.display = 'none';
    }, 5000);
}

function buscar() {
    const nombre = document.getElementById('searchInput').value.trim(); // Obtener el valor del campo de búsqueda
    cargarIngresos({ nombre }); // Llamar a la función cargarIngresos con el filtro de nombre
}

document.getElementById('filterForm').addEventListener('submit', (event) => {
    event.preventDefault(); // Evitar el comportamiento predeterminado del formulario

    const fechaInicio = document.getElementById('fechaInicio').value; // Obtener la fecha de inicio
    const fechaFin = document.getElementById('fechaFin').value; // Obtener la fecha de fin

    // Validar que las fechas sean correctas
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
        alert('La fecha de inicio no puede ser mayor que la fecha de fin.');
        return;
    }

    // Llamar a la función cargarIngresos con los filtros de fecha
    cargarIngresos({ fechaInicio, fechaFin });
});

async function inicializarEstadisticas() {
    let graficoSemanal;

    async function obtenerEstadisticas() {
        try {
            const response = await fetch('/api/estadisticas');
            if (!response.ok) {
                throw new Error('Error al obtener las estadísticas.');
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            const container = document.querySelector('.container');
            if (container) {
                container.innerHTML = '<p style="color: red; text-align: center;">Error al cargar las estadísticas. Inténtalo más tarde.</p>';
            }
            return null;
        }
    }

    function actualizarGraficos(estadisticas) {
        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const ingresosPorDia = Array(7).fill(0);

        if (estadisticas && estadisticas.porDia) {
            estadisticas.porDia.forEach(item => {
                const diaIndex = parseInt(item.dia);
                if (!isNaN(diaIndex) && diaIndex >= 0 && diaIndex < 7) {
                    ingresosPorDia[diaIndex] = item.total;
                }
            });
        }

        if (graficoSemanal) {
            graficoSemanal.destroy();
        }

        const ctxSemanal = graficoSemanalCanvas.getContext('2d');
        graficoSemanal = new Chart(ctxSemanal, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Ingresos por Día',
                    data: ingresosPorDia,
                    backgroundColor: 'rgba(166, 123, 91, 0.2)',
                    borderColor: 'rgba(166, 123, 91, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    const estadisticas = await obtenerEstadisticas();
    if (!estadisticas) return;

    actualizarGraficos(estadisticas);

    // Actualizar el gráfico cada 60 segundos
    setInterval(async () => {
        const nuevasEstadisticas = await obtenerEstadisticas();
        if (nuevasEstadisticas) {
            actualizarGraficos(nuevasEstadisticas);
        }
    }, 60000);
}

// Función para cargar ingresos (solo para la página de consultar ingresos)
async function cargarIngresos() {
    const resultadosTabla = document.getElementById('resultadosTabla');
    if (!resultadosTabla) {
        console.error('Error: No se encontró el elemento <tbody> con el ID "resultadosTabla".');
        return;
    }

    resultadosTabla.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

    try {
        const response = await fetch('/api/ingresos');
        if (!response.ok) {
            throw new Error('Error al obtener los ingresos.');
        }

        const ingresos = await response.json();

        if (ingresos.length === 0) {
            resultadosTabla.innerHTML = '<tr><td colspan="8">No se encontraron resultados.</td></tr>';
        } else {
            ingresos.forEach((ingreso) => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${ingreso.nombre}</td>
                    <td>$${parseFloat(ingreso.monto).toFixed(2)}</td>
                    <td>${ingreso.realizado}</td>
                    <td>${ingreso.quien}</td>
                    <td>${ingreso.seRealizo}</td>
                    <td>$${(ingreso.monto * 0.4).toFixed(2)}</td>
                    <td>
                        <button onclick="editarIngreso(${ingreso.id})">Editar</button>
                        <button onclick="eliminarIngreso(${ingreso.id})">Eliminar</button>
                    </td>
                `;
                resultadosTabla.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error al cargar los ingresos:', error);
        resultadosTabla.innerHTML = '<tr><td colspan="8">Error al cargar los datos.</td></tr>';
    }
}