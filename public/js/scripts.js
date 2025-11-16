   // Данные и инициализация
        const festivalEvents = [
            { id: 1, name: "Открытие фестиваля", time: "10:00-11:00", location: "Главная сцена", duration: 60 },
            { id: 2, name: "Мастер-класс по живописи", time: "11:00-12:30", location: "Павильон А", duration: 90 },
            { id: 3, name: "Концерт джаз-банда", time: "11:30-13:00", location: "Главная сцена", duration: 90 },
            { id: 4, name: "Лекция о современном искусстве", time: "12:00-13:00", location: "Конференц-зал", duration: 60 },
            { id: 5, name: "Фуд-корт: дегустация", time: "13:00-14:00", location: "Фуд-корт", duration: 60 },
            { id: 6, name: "Выставка скульптур", time: "13:30-15:00", location: "Павильон Б", duration: 90 },
            { id: 7, name: "Интерактивный спектакль", time: "14:00-15:30", location: "Главная сцена", duration: 90 },
            { id: 8, name: "Воркшоп по фотографии", time: "15:00-16:30", location: "Павильон А", duration: 90 },
            { id: 9, name: "Акустический концерт", time: "16:00-17:00", location: "Малая сцена", duration: 60 },
            { id: 10, name: "Закрытие фестиваля", time: "17:30-18:30", location: "Главная сцена", duration: 60 }
        ];

        let selectedEvents = new Set();
        let currentSchedules = [];
        let currentScenario = 'individual';
        let customEvents = [];
        let groupMembers = [
            { id: 0, name: "Участник 1", color: "#4361ee", selectedEvents: new Set() }
        ];
        let selectedScheduleId = null;
        let selectedScheduleIndex = null;

        const DB_KEYS = {
            SELECTED_EVENTS: 'festival_selected_events',
            SAVED_SCHEDULES: 'festival_saved_schedules',
            EVENT_STATS: 'festival_event_stats',
            CURRENT_SCHEDULE: 'festival_current_schedule',
            CUSTOM_EVENTS: 'festival_custom_events',
            GROUP_MEMBERS: 'festival_group_members',
            SELECTED_SCHEDULE: 'festival_selected_schedule'
        };

        // Основные функции
        function setScenario(scenario) {
            currentScenario = scenario;
            
            // Обновляем активную кнопку
            document.querySelectorAll('.scenario-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Показываем соответствующий контент
            document.querySelectorAll('.scenario-content').forEach(content => {
                content.style.display = 'none';
            });
            
            document.getElementById(scenario + 'Scenario').style.display = 'block';
            
            // Загружаем данные для сценария
            loadScenarioData();
            
            // Обновляем статистику
            updateSelectionStats();
        }

        function loadScenarioData() {
            switch(currentScenario) {
                case 'individual':
                    loadSelectedEvents();
                    break;
                case 'group':
                    loadGroupMembers();
                    renderMemberSelections();
                    break;
                case 'on-site':
                    loadCurrentSchedule();
                    loadCustomEvents();
                    break;
            }
            renderEventsList();
        }

        function initializeEvents() {
            const totalCount = document.getElementById('totalCount');
            totalCount.textContent = festivalEvents.length;
            
            loadScenarioData();
            loadSelectedSchedule();
        }

        function renderEventsList() {
            const eventsList = document.getElementById('eventsList');
            eventsList.innerHTML = '';
            
            // Объединяем стандартные и пользовательские события
            const allEvents = [...festivalEvents, ...customEvents];
            
            if (allEvents.length === 0) {
                eventsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-plus"></i>
                        <p>Нет доступных событий</p>
                    </div>
                `;
                return;
            }
            
            allEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                
                if (currentScenario === 'group') {
                    // Для группового сценария показываем, кто выбрал событие
                    const participants = getEventParticipants(event.id);
                    eventElement.innerHTML = `
                        <input type="checkbox" id="event-${event.id}" onchange="toggleGroupEvent(${event.id})" ${isEventSelectedByCurrentMember(event.id) ? 'checked' : ''}>
                        <label for="event-${event.id}">
                            <strong>${event.name}</strong>
                            ${event.custom ? '<span class="badge badge-danger">добавлено</span>' : ''}
                            <div class="event-meta">
                                <span class="time"><i class="far fa-clock"></i> ${event.time}</span>
                                <span class="location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                                <span class="duration"><i class="fas fa-hourglass-half"></i> ${event.duration} мин</span>
                            </div>
                            ${participants.length > 0 ? `
                                <div class="event-participants">
                                    Выбрали: ${participants.map(p => `<span class="participant-dot" style="background: ${p.color}"></span>${p.name}`).join(', ')}
                                </div>
                            ` : ''}
                        </label>
                    `;
                } else {
                    // Для индивидуального сценария
                    const isSelected = selectedEvents.has(event.id);
                    eventElement.innerHTML = `
                        <input type="checkbox" id="event-${event.id}" ${isSelected ? 'checked' : ''} onchange="toggleEvent(${event.id})">
                        <label for="event-${event.id}">
                            <strong>${event.name}</strong>
                            ${event.custom ? '<span class="badge badge-danger">добавлено</span>' : ''}
                            <div class="event-meta">
                                <span class="time"><i class="far fa-clock"></i> ${event.time}</span>
                                <span class="location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                                <span class="duration"><i class="fas fa-hourglass-half"></i> ${event.duration} мин</span>
                            </div>
                        </label>
                    `;
                    
                    if (isSelected) {
                        eventElement.classList.add('selected');
                    }
                }
                
                eventsList.appendChild(eventElement);
            });
            
            updateSelectionStats();
        }

        // Функции для группового планирования
        function addGroupMember() {
            const colors = ['#4361ee', '#f72585', '#4cc9f0', '#f8961e', '#4895ef', '#7209b7', '#3a0ca3'];
            const newId = groupMembers.length;
            const newColor = colors[newId % colors.length];
            
            groupMembers.push({
                id: newId,
                name: `Участник ${newId + 1}`,
                color: newColor,
                selectedEvents: new Set()
            });
            
            updateGroupMembersUI();
            renderMemberSelections();
            saveGroupMembers();
        }

        function removeMember(button) {
            if (groupMembers.length > 1) {
                const memberElement = button.parentElement;
                const memberIndex = Array.from(memberElement.parentElement.children).indexOf(memberElement);
                
                groupMembers.splice(memberIndex, 1);
                updateGroupMembersUI();
                renderMemberSelections();
                saveGroupMembers();
            } else {
                showNotification('Должен остаться хотя бы один участник!', 'danger');
            }
        }

        function updateMemberName(input, index) {
            groupMembers[index].name = input.value;
            saveGroupMembers();
            renderMemberSelections();
        }

        function updateGroupMembersUI() {
            const membersList = document.getElementById('groupMembersList');
            membersList.innerHTML = '';
            
            groupMembers.forEach((member, index) => {
                const memberElement = document.createElement('div');
                memberElement.className = 'group-member';
                memberElement.innerHTML = `
                    <input type="text" placeholder="Имя участника" value="${member.name}" onchange="updateMemberName(this, ${index})">
                    <span class="member-color" style="background: ${member.color}"></span>
                    <button onclick="removeMember(this)" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                `;
                membersList.appendChild(memberElement);
            });
        }

        function renderMemberSelections() {
            const memberSelections = document.getElementById('memberSelections');
            memberSelections.innerHTML = '';
            
            groupMembers.forEach((member, index) => {
                const selectionElement = document.createElement('div');
                selectionElement.className = 'member-selection';
                selectionElement.innerHTML = `
                    <div class="member-header">
                        <div>
                            <span class="member-color" style="background: ${member.color}"></span>
                            <span class="member-name">${member.name}</span>
                        </div>
                        <div class="member-stats">Выбрано: ${member.selectedEvents.size} событий</div>
                    </div>
                    <div class="events-container" id="memberEvents-${member.id}"></div>
                `;
                memberSelections.appendChild(selectionElement);
                
                // Рендерим события для этого участника
                renderMemberEvents(member.id);
            });
        }

        function renderMemberEvents(memberId) {
            const memberEventsContainer = document.getElementById(`memberEvents-${memberId}`);
            const member = groupMembers.find(m => m.id === memberId);
            
            if (!member) return;
            
            const allEvents = [...festivalEvents, ...customEvents];
            
            memberEventsContainer.innerHTML = '';
            
            allEvents.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event-item';
                const isSelected = member.selectedEvents.has(event.id);
                
                eventElement.innerHTML = `
                    <input type="checkbox" id="member-${memberId}-event-${event.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="toggleMemberEvent(${memberId}, ${event.id})">
                    <label for="member-${memberId}-event-${event.id}">
                        <strong>${event.name}</strong>
                        <div class="event-meta">
                            <span class="time">${event.time}</span>
                            <span class="location">${event.location}</span>
                        </div>
                    </label>
                `;
                
                if (isSelected) {
                    eventElement.classList.add('selected');
                }
                
                memberEventsContainer.appendChild(eventElement);
            });
        }

        function toggleMemberEvent(memberId, eventId) {
            const member = groupMembers.find(m => m.id === memberId);
            if (!member) return;
            
            if (member.selectedEvents.has(eventId)) {
                member.selectedEvents.delete(eventId);
            } else {
                member.selectedEvents.add(eventId);
            }
            
            renderMemberEvents(memberId);
            updateSelectionStats();
            saveGroupMembers();
        }

        function toggleGroupEvent(eventId) {
            // В групповом режиме события выбираются через отдельные интерфейсы участников
            // Эта функция может быть использована для общего выбора
            updateSelectionStats();
        }

        function isEventSelectedByCurrentMember(eventId) {
            // Для упрощения считаем, что "текущий" участник - первый в списке
            return groupMembers[0]?.selectedEvents.has(eventId) || false;
        }

        function getEventParticipants(eventId) {
            return groupMembers.filter(member => member.selectedEvents.has(eventId));
        }

        function getCommonEvents() {
            if (groupMembers.length === 0) return new Set();
            
            // Находим пересечение всех выборов участников
            let commonEvents = new Set(groupMembers[0].selectedEvents);
            
            for (let i = 1; i < groupMembers.length; i++) {
                commonEvents = new Set([...commonEvents].filter(
                    eventId => groupMembers[i].selectedEvents.has(eventId)
                ));
            }
            
            return commonEvents;
        }

        function getAllSelectedEvents() {
            // Объединяем все события, выбранные всеми участниками
            const allEvents = new Set();
            groupMembers.forEach(member => {
                member.selectedEvents.forEach(eventId => allEvents.add(eventId));
            });
            return allEvents;
        }

        // Функции для индивидуального планирования
        function toggleEvent(eventId) {
            if (selectedEvents.has(eventId)) {
                selectedEvents.delete(eventId);
            } else {
                selectedEvents.add(eventId);
                updateEventStats(eventId);
            }
            
            const eventElement = document.querySelector(`#event-${eventId}`).parentElement;
            if (eventElement) {
                eventElement.classList.toggle('selected');
            }
            
            updateSelectionStats();
            
            // Для сценария "на месте" сразу перестраиваем расписание
            if (currentScenario === 'on-site') {
                generateSchedules();
            }
        }

        function updateSelectionStats() {
            if (currentScenario === 'group') {
                const commonEventsCount = document.getElementById('commonEventsCount');
                const groupSelectionStats = document.getElementById('groupSelectionStats');
                
                const commonEvents = getCommonEvents();
                const allEvents = getAllSelectedEvents();
                
                commonEventsCount.textContent = commonEvents.size;
                
                if (allEvents.size === 0) {
                    groupSelectionStats.textContent = 'События не выбраны';
                    return;
                }
                
                const allEventsArray = Array.from(allEvents).map(id => 
                    [...festivalEvents, ...customEvents].find(event => event.id === id)
                ).filter(event => event);
                
                const locations = {};
                allEventsArray.forEach(event => {
                    locations[event.location] = (locations[event.location] || 0) + 1;
                });
                
                const mostPopularLocation = Object.keys(locations).reduce((a, b) => 
                    locations[a] > locations[b] ? a : b, 'Нет'
                );
                
                groupSelectionStats.textContent = 
                    `${mostPopularLocation} (${locations[mostPopularLocation]}), ` +
                    `всего ${allEvents.size} событий, ` +
                    `${commonEvents.size} общих`;
            } else {
                const selectedCountElements = {
                    'individual': document.getElementById('selectedCount'),
                    'on-site': document.getElementById('onSiteSelectedCount')
                };
                
                const selectionStatsElements = {
                    'individual': document.getElementById('selectionStats'),
                    'on-site': document.getElementById('onSiteSelectionStats')
                };
                
                const selectedCount = selectedCountElements[currentScenario];
                const selectionStats = selectionStatsElements[currentScenario];
                
                if (!selectedCount || !selectionStats) return;
                
                selectedCount.textContent = selectedEvents.size;
                
                if (selectedEvents.size === 0) {
                    selectionStats.textContent = 'События не выбраны';
                    return;
                }
                
                const allEvents = [...festivalEvents, ...customEvents];
                const selectedEventsArray = Array.from(selectedEvents).map(id => 
                    allEvents.find(event => event.id === id)
                );
                
                const locations = {};
                const timeSlots = {};
                let totalDuration = 0;
                
                selectedEventsArray.forEach(event => {
                    if (!event) return;
                    
                    locations[event.location] = (locations[event.location] || 0) + 1;
                    
                    const timeKey = event.time.split('-')[0].substring(0, 2);
                    timeSlots[timeKey] = (timeSlots[timeKey] || 0) + 1;
                    
                    totalDuration += event.duration;
                });
                
                const mostPopularLocation = Object.keys(locations).reduce((a, b) => locations[a] > locations[b] ? a : b, 'Нет');
                const mostPopularTime = Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b, 'Нет');
                
                selectionStats.textContent = 
                    `${mostPopularLocation} (${locations[mostPopularLocation]}), ` +
                    `в ${mostPopularTime}:00 (${timeSlots[mostPopularTime]}), ` +
                    `всего ${totalDuration} мин`;
            }
        }

        function generateSchedules() {
            if (currentScenario === 'group') {
                generateGroupSchedules();
            } else {
                generateIndividualSchedules();
            }
        }

        function generateIndividualSchedules() {
            if (selectedEvents.size === 0) {
                alert('Выберите хотя бы одно событие!');
                return;
            }

            const allEvents = [...festivalEvents, ...customEvents];
            const selectedEventsArray = Array.from(selectedEvents).map(id => 
                allEvents.find(event => event.id === id)
            ).filter(event => event !== undefined);

            selectedEventsArray.sort((a, b) => {
                return timeToMinutes(a.time.split('-')[0]) - timeToMinutes(b.time.split('-')[0]);
            });

            const schedules = [];
            
            // Генерируем 3 варианта расписания
            for (let i = 0; i < Math.min(3, selectedEventsArray.length); i++) {
                const schedule = [];
                let lastEvent = null;
                
                for (let j = i; j < selectedEventsArray.length; j++) {
                    const currentEvent = selectedEventsArray[j];
                    
                    if (!lastEvent || !hasConflict(lastEvent, currentEvent)) {
                        schedule.push(currentEvent);
                        lastEvent = currentEvent;
                    }
                }
                
                schedules.push(schedule);
            }

            schedules.sort((a, b) => b.length - a.length);
            
            currentSchedules = schedules.slice(0, 3);
            displaySchedules(currentSchedules);
            
            // Для сценария "на месте" сохраняем текущее расписание
            if (currentScenario === 'on-site') {
                saveCurrentSchedule();
            }
        }

        function generateGroupSchedules() {
            const allSelectedEvents = getAllSelectedEvents();
            
            if (allSelectedEvents.size === 0) {
                alert('Участники не выбрали ни одного события!');
                return;
            }

            const allEvents = [...festivalEvents, ...customEvents];
            const selectedEventsArray = Array.from(allSelectedEvents).map(id => 
                allEvents.find(event => event.id === id)
            ).filter(event => event !== undefined);

            // Добавляем информацию о том, кто выбрал каждое событие
            selectedEventsArray.forEach(event => {
                event.participants = getEventParticipants(event.id).map(m => m.name);
            });

            selectedEventsArray.sort((a, b) => {
                return timeToMinutes(a.time.split('-')[0]) - timeToMinutes(b.time.split('-')[0]);
            });

            const schedules = [];
            
            // Генерируем варианты с приоритетом для общих событий
            for (let i = 0; i < Math.min(3, selectedEventsArray.length); i++) {
                const schedule = [];
                let lastEvent = null;
                
                // Сначала добавляем общие события
                const commonEvents = selectedEventsArray.filter(event => {
                    const participants = getEventParticipants(event.id);
                    return participants.length === groupMembers.length;
                });
                
                commonEvents.forEach(event => {
                    if (!lastEvent || !hasConflict(lastEvent, event)) {
                        schedule.push(event);
                        lastEvent = event;
                    }
                });
                
                // Затем добавляем остальные события
                for (let j = i; j < selectedEventsArray.length; j++) {
                    const currentEvent = selectedEventsArray[j];
                    
                    if (!schedule.includes(currentEvent) && (!lastEvent || !hasConflict(lastEvent, currentEvent))) {
                        schedule.push(currentEvent);
                        lastEvent = currentEvent;
                    }
                }
                
                schedules.push(schedule);
            }

            schedules.sort((a, b) => b.length - a.length);
            
            currentSchedules = schedules.slice(0, 3);
            displaySchedules(currentSchedules);
        }

        function displaySchedules(schedules) {
            const schedulesList = document.getElementById('schedulesList');
            
            if (schedules.length === 0) {
                schedulesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>Не удалось составить расписание. Попробуйте выбрать другие события.</p>
                    </div>
                `;
                return;
            }

            schedulesList.innerHTML = '<div class="schedules-container"></div>';
            const schedulesContainer = schedulesList.querySelector('.schedules-container');
            
            schedules.forEach((schedule, index) => {
                const scheduleId = `schedule-${Date.now()}-${index}`;
                const scheduleElement = document.createElement('div');
                scheduleElement.className = 'schedule-option';
                scheduleElement.id = scheduleId;
                
                let scheduleHTML = `
                    <div class="schedule-header">
                        <h3>Вариант ${index + 1}</h3>
                        <div class="schedule-stats">${schedule.length} событий</div>
                    </div>
                    <div class="schedule-content">
                `;
                
                schedule.forEach(event => {
                    const isCustom = event.custom ? 'custom' : '';
                    const participantsInfo = currentScenario === 'group' && event.participants ? 
                        `<div class="event-participants">Для: ${event.participants.join(', ')}</div>` : '';
                    
                    scheduleHTML += `
                        <div class="time-slot ${isCustom}">
                            <strong>${event.name}</strong>
                            ${event.custom ? '<span class="badge badge-danger">добавлено</span>' : ''}
                            <div class="event-meta">
                                <span class="time"><i class="far fa-clock"></i> ${event.time}</span>
                                <span class="location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                            </div>
                            ${participantsInfo}
                        </div>
                    `;
                });
                
                scheduleHTML += `
                    </div>
                    <div class="schedule-footer">
                        <button onclick="selectSchedule('${scheduleId}', ${index})" class="btn btn-success btn-sm">
                            <i class="fas fa-check"></i> Выбрать этот вариант
                        </button>
                        <span class="schedule-stats">${calculateScheduleDuration(schedule)} мин</span>
                    </div>
                `;
                
                scheduleElement.innerHTML = scheduleHTML;
                schedulesContainer.appendChild(scheduleElement);
            });
            
            // Показываем кнопку скачивания, если есть выбранное расписание
            updateDownloadButton();
        }

        // Остальные функции (selectSchedule, resetSelection, downloadSelectedSchedule, saveCurrentSchedules и т.д.)
        // остаются аналогичными предыдущей версии, но адаптированными для работы с групповым режимом

        function selectSchedule(scheduleId, scheduleIndex) {
            selectedScheduleId = scheduleId;
            selectedScheduleIndex = scheduleIndex;
            
            // Визуально выделяем выбранное расписание
            const allSchedules = document.querySelectorAll('.schedule-option');
            allSchedules.forEach(option => {
                if (option.id === scheduleId) {
                    option.classList.add('selected-schedule');
                } else {
                    option.classList.add('fade-out');
                }
            });
            
            // Через 0.5 секунды скрываем остальные расписания
            setTimeout(() => {
                allSchedules.forEach(option => {
                    if (option.id !== scheduleId) {
                        option.style.display = 'none';
                    }
                });
            }, 500);
            
            // Сохраняем выбор
            localStorage.setItem(DB_KEYS.SELECTED_SCHEDULE, JSON.stringify({
                id: scheduleId,
                index: scheduleIndex,
                schedule: currentSchedules[scheduleIndex],
                selectedAt: new Date().toISOString()
            }));
            
            // Обновляем кнопки
            updateActionButtons();
            
            // Показываем уведомление
            showNotification(`Расписание вариант ${scheduleIndex + 1} выбрано!`, 'success');
        }

        function resetSelection() {
            selectedScheduleId = null;
            selectedScheduleIndex = null;
            
            // Показываем все расписания снова
            const allSchedules = document.querySelectorAll('.schedule-option');
            allSchedules.forEach(option => {
                option.style.display = 'block';
                option.classList.remove('selected-schedule', 'fade-out');
            });
            
            // Удаляем из localStorage
            localStorage.removeItem(DB_KEYS.SELECTED_SCHEDULE);
            
            // Обновляем кнопки
            updateActionButtons();
            
            showNotification('Выбор сброшен!', 'info');
        }

        function updateActionButtons() {
            const downloadBtn = document.getElementById('downloadBtn');
            const resetBtn = document.getElementById('resetBtn');
            
            if (selectedScheduleId) {
                downloadBtn.style.display = 'flex';
                resetBtn.style.display = 'flex';
            } else {
                downloadBtn.style.display = 'none';
                resetBtn.style.display = 'none';
            }
        }

        function downloadSelectedSchedule() {
            if (!selectedScheduleId) {
                alert('Сначала выберите расписание!');
                return;
            }
            
            const savedSelection = localStorage.getItem(DB_KEYS.SELECTED_SCHEDULE);
            if (!savedSelection) {
                alert('Выбранное расписание не найдено!');
                return;
            }
            
            const selectionData = JSON.parse(savedSelection);
            const schedule = selectionData.schedule;
            
            // Формируем содержимое файла
            let content = `Мое расписание фестиваля\n`;
            content += `========================\n\n`;
            content += `Создано: ${new Date().toLocaleString()}\n`;
            content += `Количество событий: ${schedule.length}\n`;
            content += `Общая продолжительность: ${calculateScheduleDuration(schedule)} мин\n`;
            
            if (currentScenario === 'group') {
                content += `Участники: ${groupMembers.map(m => m.name).join(', ')}\n`;
            }
            
            content += `\nРАСПИСАНИЕ:\n`;
            content += `-----------\n\n`;
            
            schedule.forEach((event, index) => {
                content += `${index + 1}. ${event.time} - ${event.name}\n`;
                content += `   📍 ${event.location} | ⏱ ${event.duration} мин\n`;
                
                if (currentScenario === 'group' && event.participants) {
                    content += `   👥 Для: ${event.participants.join(', ')}\n`;
                }
                content += `\n`;
            });
            
            content += `\nПриятного времяпрепровождения на фестивале! 🎉`;
            
            // Создаем и скачиваем файл
            const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `мое-расписание-фестиваля-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Расписание успешно скачано!', 'success');
        }

        function calculateScheduleDuration(schedule) {
            return schedule.reduce((total, event) => total + event.duration, 0);
        }

        function saveCurrentSchedules() {
            if (currentSchedules.length === 0) {
                alert('Нет расписаний для сохранения! Сначала сгенерируйте расписания.');
                return;
            }
            
            const savedSchedules = getSavedSchedules();
            const timestamp = new Date().toLocaleString();
            
            const scheduleData = {
                id: Date.now(),
                name: `Расписание от ${timestamp}`,
                schedules: currentSchedules,
                selectedEvents: currentScenario === 'group' ? Array.from(getAllSelectedEvents()) : Array.from(selectedEvents),
                createdAt: new Date().toISOString(),
                totalEvents: currentSchedules[0]?.length || 0,
                scenario: currentScenario,
                groupMembers: currentScenario === 'group' ? groupMembers : null
            };
            
            savedSchedules.push(scheduleData);
            localStorage.setItem(DB_KEYS.SAVED_SCHEDULES, JSON.stringify(savedSchedules));
            
            showNotification('Расписания сохранены!', 'success');
            loadSavedSchedules();
        }

        // Функции для работы с LocalStorage
        function saveGroupMembers() {
            const membersToSave = groupMembers.map(member => ({
                ...member,
                selectedEvents: Array.from(member.selectedEvents)
            }));
            localStorage.setItem(DB_KEYS.GROUP_MEMBERS, JSON.stringify(membersToSave));
        }

        function loadGroupMembers() {
            const savedMembers = localStorage.getItem(DB_KEYS.GROUP_MEMBERS);
            if (savedMembers) {
                const membersData = JSON.parse(savedMembers);
                groupMembers = membersData.map(member => ({
                    ...member,
                    selectedEvents: new Set(member.selectedEvents)
                }));
            }
        }

        function loadSelectedEvents() {
            const savedEvents = localStorage.getItem(DB_KEYS.SELECTED_EVENTS);
            if (savedEvents) {
                const eventsArray = JSON.parse(savedEvents);
                selectedEvents = new Set(eventsArray);
            } else {
                selectedEvents = new Set();
            }
        }

        function saveSelection() {
            if (currentScenario === 'group') {
                saveGroupMembers();
                showNotification('Выбор участников сохранен!', 'success');
            } else {
                if (selectedEvents.size === 0) {
                    alert('Нет выбранных событий для сохранения!');
                    return;
                }
                
                const selectedEventsArray = Array.from(selectedEvents);
                localStorage.setItem(DB_KEYS.SELECTED_EVENTS, JSON.stringify(selectedEventsArray));
                showNotification(`Сохранено ${selectedEvents.size} событий!`, 'success');
            }
        }

        function clearSelection() {
            if (currentScenario === 'group') {
                if (confirm('Очистить выбор всех участников?')) {
                    groupMembers.forEach(member => {
                        member.selectedEvents.clear();
                    });
                    renderMemberSelections();
                    updateSelectionStats();
                    saveGroupMembers();
                    showNotification('Выбор всех участников очищен!', 'success');
                }
            } else {
                if (confirm('Очистить все выбранные события?')) {
                    selectedEvents.clear();
                    document.querySelectorAll('.event-item input[type="checkbox"]').forEach(checkbox => {
                        checkbox.checked = false;
                        checkbox.parentElement.classList.remove('selected');
                    });
                    updateSelectionStats();
                    localStorage.removeItem(DB_KEYS.SELECTED_EVENTS);
                    showNotification('Выбор очищен!', 'success');
                }
            }
        }

        // Вспомогательные функции (timeToMinutes, minutesToTime, hasConflict, showNotification и т.д.)
        // остаются такими же как в предыдущей версии

        function timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        }

        function minutesToTime(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }

        function hasConflict(event1, event2) {
            const [start1, end1] = event1.time.split('-').map(timeToMinutes);
            const [start2, end2] = event2.time.split('-').map(timeToMinutes);
            
            const timeConflict = !(end1 <= start2 || end2 <= start1);
            const locationConflict = event1.location === event2.location && timeConflict;
            
            return timeConflict || locationConflict;
        }

        function showNotification(message, type) {
            // Создаем уведомление
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? 'var(--success)' : type === 'danger' ? 'var(--danger)' : 'var(--info)'};
                color: white;
                border-radius: var(--border-radius);
                box-shadow: var(--box-shadow);
                z-index: 1000;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
            `;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : type === 'danger' ? 'exclamation' : 'info'}"></i>
                <span>${message}</span>
            `;
            
            document.body.appendChild(notification);
            
            // Удаляем уведомление через 3 секунды
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

        // Добавляем стили для анимации уведомлений
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Остальные функции (loadSavedSchedules, loadSavedSchedule, deleteSavedSchedule, addCustomEvent и т.д.)
        // остаются аналогичными предыдущей версии

        function getSavedSchedules() {
            const saved = localStorage.getItem(DB_KEYS.SAVED_SCHEDULES);
            return saved ? JSON.parse(saved) : [];
        }

        function loadSavedSchedules() {
            const savedSchedulesList = document.getElementById('savedSchedulesList');
            const savedSchedulesSection = document.getElementById('savedSchedulesSection');
            const savedSchedules = getSavedSchedules();
            
            savedSchedulesList.innerHTML = '';
            savedSchedulesSection.style.display = 'block';
            
            if (savedSchedules.length === 0) {
                savedSchedulesList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bookmark"></i>
                        <p>Нет сохраненных расписаний</p>
                    </div>
                `;
                return;
            }
            
            savedSchedules.forEach((savedSchedule) => {
                const scheduleElement = document.createElement('div');
                scheduleElement.className = 'saved-schedule';
                
                let scheduleHTML = `
                    <div class="saved-schedule-header">
                        <h4>${savedSchedule.name}</h4>
                        <div class="schedule-meta">
                            <small><i class="far fa-calendar"></i> ${new Date(savedSchedule.createdAt).toLocaleString()}</small><br>
                            <small><i class="fas fa-list"></i> ${savedSchedule.totalEvents} событий</small><br>
                            <small><i class="fas fa-user"></i> ${getScenarioName(savedSchedule.scenario)}</small>
                        </div>
                    </div>
                    <div class="saved-schedule-content">
                `;
                
                // Показываем только первый вариант для компактности
                const firstSchedule = savedSchedule.schedules[0];
                if (firstSchedule) {
                    firstSchedule.slice(0, 3).forEach(event => {
                        scheduleHTML += `
                            <div class="time-slot">
                                <strong>${event.name}</strong>
                                <div class="event-meta">
                                    <span class="time">${event.time}</span>
                                    <span class="location">${event.location}</span>
                                </div>
                            </div>
                        `;
                    });
                    
                    if (firstSchedule.length > 3) {
                        scheduleHTML += `<div class="time-slot">... и еще ${firstSchedule.length - 3} событий</div>`;
                    }
                }
                
                scheduleHTML += `
                    </div>
                    <div class="saved-schedule-footer">
                        <button onclick="loadSavedSchedule(${savedSchedule.id})" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Просмотр
                        </button>
                        <button onclick="deleteSavedSchedule(${savedSchedule.id})" class="btn btn-danger btn-sm">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                `;
                
                scheduleElement.innerHTML = scheduleHTML;
                savedSchedulesList.appendChild(scheduleElement);
            });
        }

        function loadSavedSchedule(scheduleId) {
            const savedSchedules = getSavedSchedules();
            const scheduleToLoad = savedSchedules.find(s => s.id === scheduleId);
            
            if (scheduleToLoad) {
                if (scheduleToLoad.scenario === 'group' && scheduleToLoad.groupMembers) {
                    groupMembers = scheduleToLoad.groupMembers.map(member => ({
                        ...member,
                        selectedEvents: new Set(member.selectedEvents)
                    }));
                    updateGroupMembersUI();
                    renderMemberSelections();
                } else {
                    selectedEvents = new Set(scheduleToLoad.selectedEvents);
                }
                
                document.querySelectorAll('.event-item input[type="checkbox"]').forEach(checkbox => {
                    const eventId = parseInt(checkbox.id.replace('event-', ''));
                    checkbox.checked = selectedEvents.has(eventId);
                    checkbox.parentElement.classList.toggle('selected', selectedEvents.has(eventId));
                });
                
                updateSelectionStats();
                
                currentSchedules = scheduleToLoad.schedules;
                displaySchedules(currentSchedules);
                
                showNotification(`Расписание "${scheduleToLoad.name}" загружено!`, 'success');
            }
        }

        function deleteSavedSchedule(scheduleId) {
            if (confirm('Удалить это расписание?')) {
                const savedSchedules = getSavedSchedules();
                const updatedSchedules = savedSchedules.filter(s => s.id !== scheduleId);
                localStorage.setItem(DB_KEYS.SAVED_SCHEDULES, JSON.stringify(updatedSchedules));
                loadSavedSchedules();
                showNotification('Расписание удалено!', 'success');
            }
        }

        function getScenarioName(scenario) {
            switch(scenario) {
                case 'individual': return 'Индивидуальное';
                case 'group': return 'Групповое';
                case 'on-site': return 'На месте';
                default: return 'Индивидуальное';
            }
        }

        function updateEventStats(eventId) {
            const stats = getEventStats();
            stats[eventId] = (stats[eventId] || 0) + 1;
            localStorage.setItem(DB_KEYS.EVENT_STATS, JSON.stringify(stats));
        }

        function getEventStats() {
            const stats = localStorage.getItem(DB_KEYS.EVENT_STATS);
            return stats ? JSON.parse(stats) : {};
        }

        function loadSelectedSchedule() {
            const savedSelection = localStorage.getItem(DB_KEYS.SELECTED_SCHEDULE);
            if (savedSelection) {
                const selectionData = JSON.parse(savedSelection);
                selectedScheduleId = selectionData.id;
                selectedScheduleIndex = selectionData.index;
                updateActionButtons();
            }
        }

        // Функции для сценария "на месте"
        function addCustomEvent() {
            const name = document.getElementById('newEventName').value;
            const startTime = document.getElementById('newEventStartTime').value;
            const duration = parseInt(document.getElementById('newEventDuration').value);
            const location = document.getElementById('newEventLocation').value;
            
            if (!name || !startTime || !duration) {
                alert('Заполните все поля!');
                return;
            }
            
            const startMinutes = timeToMinutes(startTime);
            const endMinutes = startMinutes + duration;
            const timeString = `${startTime}-${minutesToTime(endMinutes)}`;
            
            const newEvent = {
                id: Date.now(), // Уникальный ID на основе времени
                name: name,
                time: timeString,
                location: location,
                duration: duration,
                custom: true
            };
            
            customEvents.push(newEvent);
            saveCustomEvents();
            renderEventsList();
            
            // Очищаем форму
            document.getElementById('newEventName').value = '';
            document.getElementById('newEventStartTime').value = '';
            document.getElementById('newEventDuration').value = '60';
            
            showNotification('Событие добавлено!', 'success');
        }

        function loadCustomEvents() {
            const savedEvents = localStorage.getItem(DB_KEYS.CUSTOM_EVENTS);
            if (savedEvents) {
                customEvents = JSON.parse(savedEvents);
            } else {
                customEvents = [];
            }
        }

        function saveCustomEvents() {
            localStorage.setItem(DB_KEYS.CUSTOM_EVENTS, JSON.stringify(customEvents));
        }

        function loadCurrentSchedule() {
            const savedSchedule = localStorage.getItem(DB_KEYS.CURRENT_SCHEDULE);
            if (savedSchedule) {
                const scheduleData = JSON.parse(savedSchedule);
                selectedEvents = new Set(scheduleData.selectedEvents || []);
                currentSchedules = scheduleData.schedules || [];
                
                // Отображаем текущее расписание
                displayCurrentSchedule();
            } else {
                selectedEvents = new Set();
                currentSchedules = [];
            }
        }

        function saveCurrentSchedule() {
            const scheduleData = {
                selectedEvents: Array.from(selectedEvents),
                schedules: currentSchedules,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(DB_KEYS.CURRENT_SCHEDULE, JSON.stringify(scheduleData));
        }

        function displayCurrentSchedule() {
            const currentScheduleDisplay = document.getElementById('currentScheduleDisplay');
            
            if (currentSchedules.length === 0) {
                currentScheduleDisplay.innerHTML = `
                    <i class="fas fa-calendar-plus"></i>
                    <p>У вас пока нет активного расписания</p>
                `;
                return;
            }
            
            // Показываем первый вариант как текущий
            const currentSchedule = currentSchedules[0];
            
            let scheduleHTML = '';
            currentSchedule.forEach(event => {
                scheduleHTML += `
                    <div class="time-slot">
                        <strong>${event.name}</strong>
                        ${event.custom ? '<span class="badge badge-danger">добавлено</span>' : ''}
                        <div class="event-meta">
                            <span class="time">${event.time}</span>
                            <span class="location">${event.location}</span>
                        </div>
                    </div>
                `;
            });
            
            currentScheduleDisplay.innerHTML = scheduleHTML;
        }

        // Инициализация при загрузке страницы
        window.onload = function() {
            initializeEvents();
            loadSavedSchedules();
        };
        