document.addEventListener('DOMContentLoaded', () => {
    console.log('El archivo scripts.js se está ejecutando.');

    // Verificar si estamos en la página de estadísticas
    const canvas = document.getElementById('graficoSemanal');
    if (canvas) {
        cargarEstadisticas(); // Llamar a la función solo si el canvas existe
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    console.log('El archivo scripts.js se está ejecutando.');

    // Registrar un ingreso
    const formIngreso = document.getElementById('form-ingreso');
    const mensaje = document.getElementById('mensaje');
    const submitButton = formIngreso.querySelector('button[type="submit"]');

    // Frases del día
    const frases = [
        '"La belleza comienza en el momento en que decides ser tú mismo." - Coco Chanel',
        '"La felicidad no es algo hecho. Proviene de tus propias acciones." - Dalai Lama',
        '"El éxito es la suma de pequeños esfuerzos repetidos día tras día." - Robert Collier',
        '"La vida es 10% lo que te sucede y 90% cómo reaccionas a ello." - Charles R. Swindoll',
        '"La mejor manera de predecir el futuro es crearlo." - Peter Drucker',
        '"No cuentes los días, haz que los días cuenten." - Muhammad Ali',
        '"El único modo de hacer un gran trabajo es amar lo que haces." - Steve Jobs',
        '"La educación es el arma más poderosa que puedes usar para cambiar el mundo." - Nelson Mandela',
        '"El fracaso es simplemente la oportunidad de comenzar de nuevo, esta vez con más inteligencia." - Henry Ford',
        '"La felicidad no es tener lo que quieres, sino querer lo que tienes." - Dale Carnegie',
        '"El único límite para nuestro logro de mañana será nuestras dudas de hoy." - Franklin D. Roosevelt',
        '"La creatividad es la inteligencia divirtiéndose." - Albert Einstein',
        '"El éxito no es la clave de la felicidad. La felicidad es la clave del éxito." - Albert Schweitzer',
        '"Haz de cada día tu obra maestra." - John Wooden',
        '"El optimismo es la fe que conduce al logro." - Helen Keller',
        '"La vida no se trata de encontrarte a ti mismo, sino de crearte a ti mismo." - George Bernard Shaw',
        '"El coraje es resistencia al miedo, dominio del miedo, no ausencia de miedo." - Mark Twain',
        '"La única forma de hacer un gran trabajo es amar lo que haces." - Steve Jobs',
        '"El futuro pertenece a quienes creen en la belleza de sus sueños." - Eleanor Roosevelt',
        '"No importa lo lento que vayas, siempre y cuando no te detengas." - Confucio',
        '"El éxito es la habilidad de ir de fracaso en fracaso sin perder el entusiasmo." - Winston Churchill',
        '"La felicidad no depende de lo que tienes, sino de lo que eres." - Buda',
        '"El cambio es el resultado final de todo verdadero aprendizaje." - Leo Buscaglia',
        '"La única manera de hacer algo genial es amar lo que haces." - Steve Jobs',
        '"La vida es como montar en bicicleta. Para mantener el equilibrio, debes seguir adelante." - Albert Einstein',
        '"El único lugar donde el éxito viene antes que el trabajo es en el diccionario." - Vidal Sassoon',
        '"El secreto para salir adelante es comenzar." - Mark Twain',
        '"La mejor manera de empezar algo es dejar de hablar y comenzar a hacerlo." - Walt Disney',
        '"El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el valor para continuar." - Winston Churchill'
    ];

    // Seleccionar una frase aleatoria
    const dailyPhraseElement = document.getElementById('dailyPhrase');
    if (dailyPhraseElement) {
        const randomIndex = Math.floor(Math.random() * frases.length);
        dailyPhraseElement.textContent = frases[randomIndex];
    }

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
                    mensaje.textContent = result.message || 'Ingreso registrado correctamente';
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

// Función para cargar ingresos (solo para la página de consultar ingresos)
async function cargarIngresos(filtros = {}) {
    const resultadosTabla = document.getElementById('resultadosTabla');
    if (!resultadosTabla) {
        console.error('Error: No se encontró el elemento <tbody> con el ID "resultadosTabla".');
        return;
    }

    resultadosTabla.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

    try {
        // Construir la URL con los filtros como parámetros de consulta
        const queryParams = new URLSearchParams(filtros).toString();
        const response = await fetch(`/api/ingresos?${queryParams}`);
        if (!response.ok) {
            throw new Error('Error al obtener los ingresos.');
        }

        const ingresos = await response.json();

        if (ingresos.length === 0) {
            resultadosTabla.innerHTML = '<tr><td colspan="8">No se encontraron resultados.</td></tr>';
        } else {
            renderIngresos(ingresos);
        }
    } catch (error) {
        console.error('Error al cargar los ingresos:', error);
        resultadosTabla.innerHTML = '<tr><td colspan="8">Error al cargar los datos.</td></tr>';
    }
}

// Función para cargar citas en la tabla
async function cargarCitas() {
    const tablaCitas = document.getElementById('tablaCitas');
    tablaCitas.innerHTML = ''; // Limpiar la tabla antes de cargar los datos

    try {
        const response = await fetch('/api/citas');
        if (!response.ok) throw new Error('Error al cargar las citas.');

        const citas = await response.json();

        // Validar que `citas` sea un array
        if (!Array.isArray(citas)) {
            throw new Error('El formato de los datos recibidos no es válido.');
        }

        if (citas.length === 0) {
            tablaCitas.innerHTML = '<tr><td colspan="6">No hay citas programadas.</td></tr>';
        } else {
            citas.forEach((cita) => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${cita.nombre || 'Sin nombre'}</td>
                    <td>${cita.fecha || 'Sin fecha'}</td>
                    <td>${cita.hora || 'Sin hora'}</td>
                    <td ${cita.servicio || 'Sin servicio'}</td>
                    <td>${cita.estado || 'Pendiente'}</td>
                    <td>
                        <button onclick="editarCita(${cita.id})">Editar</button>
                        <button onclick="eliminarCita(${cita.id})">Eliminar</button>
                    </td>
                `;
                tablaCitas.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error al cargar las citas:', error);
        tablaCitas.innerHTML = '<tr><td colspan="6">Error al cargar las citas.</td></tr>';
    }
}

// Función para manejar el envío del formulario de citas
document.getElementById('addCitaForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        nombre: document.getElementById('nombreCliente').value,
        servicio: document.getElementById('servicio').value,
        fecha: document.getElementById('fechaCita').value,
        hora: document.getElementById('horaCita').value,
    };

    try {
        const response = await fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            mostrarMensajeFlotante('Cita añadida correctamente');
            document.getElementById('addCitaForm').reset(); // Limpiar el formulario
            cargarCitas(); // Recargar la tabla de citas
        } else {
            const error = await response.json();
            mostrarMensajeFlotante(`Error al añadir la cita: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al añadir la cita:', error);
        mostrarMensajeFlotante('Error al conectar con el servidor', 'error');
    }
});

// Cargar las citas al cargar la página
document.addEventListener('DOMContentLoaded', cargarCitas);

function renderIngresos(ingresos) {
    const tbody = document.getElementById('resultadosTabla');
    tbody.innerHTML = '';

    ingresos.forEach(ingreso => {
        console.log('Ingreso recibido:', ingreso); // Depuración

        const row = document.createElement('tr');

        // Formatea la fecha
        const fechaFormateada = ingreso.realizado.split('T')[0];

        // Usa el nombre correcto del campo
        const seRealizo = ingreso.serealizo || 'No especificado';

        row.innerHTML = `
            <tr id="ingreso-${ingreso.id}">
                <td>${ingreso.nombre}</td>
                <td>$${ingreso.monto}</td>
                <td>${fechaFormateada}</td>
                <td>${ingreso.quien}</td>
                <td>${seRealizo}</td>
                <td>$${(ingreso.monto * 0.4).toFixed(2)}</td>
                <td>
                    <button class="btn-editar" onclick="editarIngreso(${ingreso.id})">Editar</button>
                    <button class="btn-eliminar" onclick="eliminarIngreso(${ingreso.id})">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.appendChild(row);
    });
}

async function editarIngreso(id) {
    try {
        const response = await fetch(`/api/ingresos/${id}`);
        if (!response.ok) throw new Error('Error al obtener los datos del ingreso.');
        const ingreso = await response.json();

        const formularioHTML = `
            <h3>Editar Ingreso</h3>
            <form id="editarIngresoForm">
                <label for="nombre">Nombre:</label>
                <input type="text" id="nombre" name="nombre" value="${ingreso.nombre}" required>
                
                <label for="monto">Monto:</label>
                <input type="number" id="monto" name="monto" step="any" value="${ingreso.monto}" required>
                
                <label for="realizado">Fecha:</label>
                <input type="date" id="realizado" name="realizado" value="${ingreso.realizado.split('T')[0]}" required>
                
                <label for="quien">Lo Realizó:</label>
                <input type="text" id="quien" name="quien" value="${ingreso.quien}" required>
                
                <label for="seRealizo">¿Se realizó?</label>
                <input type="text" id="seRealizo" name="seRealizo" value="${ingreso.seRealizo}" required>
                
                <button type="submit">Guardar Cambios</button>
                <button type="button" onclick="cerrarModal()">Cancelar</button>
            </form>
        `;

        mostrarModal(formularioHTML);

        const editarIngresoForm = document.getElementById('editarIngresoForm');
        editarIngresoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nuevoNombre = document.getElementById('nombre').value.trim();
            const nuevoMonto = parseFloat(document.getElementById('monto').value);
            const nuevaFecha = document.getElementById('realizado').value;
            const nuevoQuien = document.getElementById('quien').value.trim();
            const nuevoSeRealizo = document.getElementById('seRealizo').value.trim();

            try {
                const response = await fetch(`/api/ingresos/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nuevoNombre,
                        monto: nuevoMonto,
                        realizado: nuevaFecha,
                        quien: nuevoQuien,
                        seRealizo: nuevoSeRealizo
                    })
                });

                if (response.ok) {
                    mostrarModal('<p>Ingreso editado correctamente.</p><button onclick="cerrarModal()">Cerrar</button>');
                    cerrarModal(); // Cerrar el modal de edición
                    cargarIngresos(); // Recargar la tabla
                } else {
                    const error = await response.json();
                    mostrarModal(`<p>Error al editar el ingreso: ${error.error}</p><button onclick="cerrarModal()">Cerrar</button>`);
                }
            } catch (error) {
                console.error('Error al editar el ingreso:', error);
                mostrarModal('<p>Error al editar el ingreso.</p><button onclick="cerrarModal()">Cerrar</button>');
            }
        });
    } catch (error) {
        console.error('Error al cargar los datos del ingreso:', error);
        mostrarModal('<p>Error al cargar los datos del ingreso.</p><button onclick="cerrarModal()">Cerrar</button>');
    }
}

async function eliminarIngreso(id) {
    // Crear el contenido del modal de confirmación
    const confirmacionHTML = `
        <h3>Confirmar Eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar este ingreso?</p>
        <button onclick="confirmarEliminarIngreso(${id})" style="margin-right: 10px;">Sí, eliminar</button>
        <button onclick="cerrarModal()">Cancelar</button>
    `;

    // Mostrar el modal con el contenido de confirmación
    mostrarModal(confirmacionHTML);
}

async function confirmarEliminarIngreso(id) {
    try {
        const response = await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
        if (response.ok) {
            mostrarModal('<p>Ingreso eliminado correctamente.</p><button onclick="cerrarModal()">Cerrar</button>');
            cargarIngresos(); // Recargar la tabla después de eliminar
        } else {
            const error = await response.json();
            mostrarModal(`<p>Error al eliminar el ingreso: ${error.error || 'Error desconocido.'}</p><button onclick="cerrarModal()">Cerrar</button>`);
        }
    } catch (error) {
        console.error('Error al eliminar el ingreso:', error);
        mostrarModal('<p>Error al eliminar el ingreso.</p><button onclick="cerrarModal()">Cerrar</button>');
    }
}

async function editarCita(id) {
    try {
        const response = await fetch(`/api/citas/${id}`);
        if (!response.ok) throw new Error('Error al obtener los datos de la cita.');
        const cita = await response.json();

        const formularioHTML = `
            <h3>Editar Cita</h3>
            <form id="editarCitaForm">
                <label for="nombre">Nombre del Cliente:</label>
                <input type="text" id="nombre" name="nombre" value="${cita.nombre}" required>

                <label for="fecha">Fecha:</label>
                <input type="date" id="fecha" name="fecha" value="${cita.fecha}" required>

                <label for="hora">Hora:</label>
                <input type="time" id="hora" name="hora" value="${cita.hora}" required>

                <label for="servicio">Servicio:</label>
                <input type="text" id="servicio" name="servicio" value="${cita.servicio}" required>

                <label for="estado">Estado:</label>
                <select id="estado" name="estado" class="custom-select">
                    <option value="Pendiente" ${cita.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="Asistió" ${cita.estado === 'Asistió' ? 'selected' : ''}>Asistió</option>
                    <option value="No asistió" ${cita.estado === 'No asistió' ? 'selected' : ''}>No asistió</option>
                </select>

                <button type="submit">Guardar Cambios</button>
                <button type="button" onclick="cerrarModal()">Cancelar</button>
            </form>
        `;

        mostrarModal(formularioHTML);

        const editarCitaForm = document.getElementById('editarCitaForm');
        editarCitaForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const body = {
                nombre: document.getElementById('nombre').value,
                fecha: document.getElementById('fecha').value,
                hora: document.getElementById('hora').value,
                servicio: document.getElementById('servicio').value,
                estado: document.getElementById('estado').value,
            };

            try {
                const response = await fetch(`/api/citas/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (response.ok) {
                    mostrarModal('<p>Cita editada correctamente.</p><button onclick="cerrarModal()">Cerrar</button>');
                    cargarCitas(); // Recargar la tabla de citas
                } else {
                    const error = await response.json();
                    mostrarModal(`<p>Error al editar la cita: ${error.error || 'Error desconocido.'}</p><button onclick="cerrarModal()">Cerrar</button>`);
                }
            } catch (error) {
                console.error('Error al editar la cita:', error);
                mostrarModal('<p>Error al editar la cita.</p><button onclick="cerrarModal()">Cerrar</button>');
            }
        });
    } catch (error) {
        console.error('Error al cargar los datos de la cita:', error);
        mostrarModal('<p>Error al cargar los datos de la cita.</p><button onclick="cerrarModal()">Cerrar</button>');
    }
}

// Función para eliminar una cita
async function eliminarCita(id) {
    const confirmacionHTML = `
        <h3>Confirmar Eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar esta cita?</p>
        <button onclick="confirmarEliminar(${id})">Sí, eliminar</button>
        <button onclick="cerrarModal()">Cancelar</button>
    `;
    mostrarModal(confirmacionHTML);
}

async function confirmarEliminar(id) {
    try {
        const response = await fetch(`/api/citas/${id}`, { method: 'DELETE' });
        if (response.ok) {
            mostrarMensajeFlotante('Cita eliminada correctamente');
            cerrarModal(); // Cerrar el modal después de eliminar
            cargarCitas(); // Recargar la tabla
        } else {
            mostrarModal('<p>Error al eliminar la cita.</p><button onclick="cerrarModal()">Cerrar</button>');
        }
    } catch (error) {
        console.error('Error al eliminar la cita:', error);
        mostrarModal('<p>Error al eliminar la cita.</p><button onclick="cerrarModal()">Cerrar</button>');
    }
}

function mostrarModal(contenido) {
    cerrarModal(); // Asegúrate de que no haya modales duplicados

    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    modalContent.style.width = '50%';
    modalContent.style.maxWidth = '600px';
    modalContent.style.textAlign = 'center'; // Centrar el contenido del texto
    modalContent.innerHTML = contenido;

    modal.appendChild(modalContent);
    document.body.appendChild(modal); 
}

function cerrarModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.remove();
    }
}

async function cargarEstadisticas() {
    const loadingMessage = document.getElementById('loadingMessage');
    const canvas = document.getElementById('graficoSemanal');

    if (!loadingMessage || !canvas) {
        console.error('Elementos necesarios para cargar las estadísticas no encontrados.');
        return;
    }

    try {
        // Mostrar mensaje de carga
        loadingMessage.style.display = 'block';

        // Obtener datos del servidor
        const response = await fetch('/api/estadisticas');
        if (!response.ok) throw new Error('Error al cargar las estadísticas.');

        const datos = await response.json();

        // Procesar los datos para el gráfico
        const labels = datos.map(d => d.fecha);
        const valores = datos.map(d => parseFloat(d.total));

        // Crear un degradado para el gráfico
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(75, 192, 192, 0.8)'); // Color inicial
        gradient.addColorStop(1, 'rgba(153, 102, 255, 0.8)'); // Color final

        // Crear el gráfico
        new Chart(ctx, {
            type: 'bar', // Gráfico de barras
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos diarios (últimos días)',
                    data: valores,
                    backgroundColor: gradient, // Aplicar el degradado
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Fecha',
                            color: '#333',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#555'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Monto ($)',
                            color: '#333',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#555',
                            callback: function(value) {
                                return `$${value}`;
                            }
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        // Ocultar mensaje de carga
        loadingMessage.style.display = 'none';
    } catch (error) {
        console.error('Error al cargar las estadísticas:', error);
        loadingMessage.textContent = 'Error al cargar los datos.';
    }
}

// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', cargarEstadisticas);