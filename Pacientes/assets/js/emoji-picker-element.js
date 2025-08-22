
// Emoji Picker personalizado (simple)
document.addEventListener('DOMContentLoaded', () => {
	const iconoInput = document.getElementById('etiqueta-icono');
	const iconoBtn = document.getElementById('etiqueta-icono-btn');
	const iconoGroup = document.getElementById('etiqueta-icono-group');
	if (!iconoInput || !iconoBtn || !iconoGroup) return;


	// Categorías de emojis
	const emojiCategories = {
	'Caras': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😍','🥰','😘','😎','🤩','🥳','😜','🤪','😇','🥺','😢','😭','😡','🤬','🤯','😱','😴','🤠','😋','😏','😐','😑','😶','🙄','😬','🤥','😌','😔','😪','🤤','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','💀','👻','👽','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾'],
	'Animales': ['🐶','🐱','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐵','🙈','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐛','🦋','🐌','🐞','🐜','🪲','🐍','🦂','🦀','🦐','🦑','🐙','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦥','🦦','🦨','🦡','🐁','🐀','🐇','🐿️','🦔','🐾'],
	'Naturaleza': ['🎄','🌳','🌴','☘️','🍀','🎍','🍃','🍂','🍁','🍄','🌰','🌷','🌹','🌺','🌸','🌞','🌝','🌚','🌕','🌖','🌗','🌘','�','🌒','🌏','🔥','🌈','⭐','🌟','✨','💫','🪐','🌤️','⛅','🌦️','🌧️','🌨️','🌩️','🌪️','🌫️','🌬️','🌀','🌊','🦋','🐞','🐝'],
	'Corazones': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💤','💢','💥','💦','💨','💫','💣','💬','💭'],
	'Objetos': ['⚡','🔥','🎃','🧠','🦷','🩸','☠️','💀','👻','🤖','🎩','🕶️','👓','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','🛍️','🎒','🩴','👞','👟','🥾','🥿','👠','👡','🧢','👒','🎓','⛑️','📿','💄','💍','💎','🔪','🧸','🪆','🛎️','🧿','🧩','🧸','🪅','🪆','🧸'],
	'Comida': ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🥥','🥝','🍅','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🍞','🥖','🥨','🥯','🥞','🧇','🧀','🍳','🥚','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫔','🥪','🥙','🧆','🌮','🌯','🥗','🥘','🫕','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🥠','🥮','🥧','🧁','🍼','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🥄','🍴','🍽️'],
	'Símbolos': ['✌️','🤞','🤟','🤘','🤙','👉','👆','👇','🖖','🫰','🫵','🫲','🫳','🫴','🙏','✊','👊','🤜','🤚','💪','🦵','🦶','🧠','🦷','🩸','👶','🧒','👦','👧','🧑','👱','👨','👩','🧔','👵','🧓','👴','👲','👳','🧕','👮','👷','💂','🕵️','👩‍⚕️','👨‍⚕️','👩‍🎓','👨‍🎓','👩‍🏫','👨‍🏫','👩‍⚖️','👨‍⚖️','👩‍🌾','👨‍🌾','👩‍🍳','👨‍🍳','👩‍🔧','👨‍🔧','👩‍🏭','👨‍🏭','👩‍💼','👨‍💼','👩‍🔬','👨‍🔬','👩‍🎤','👨‍🎤','👩‍🚒','👨‍🚒','👩‍✈️','👨‍✈️','👩‍🚀','👨‍🚀','🧑‍⚕️','🧑‍🔬','🧑‍🎓','🧑‍🏫','🧑‍⚖️','🧑‍🌾','🧑‍🍳','🧑‍🔧','🧑‍🏭','🧑‍💼','🧑‍🎤','🧑‍🚒','🧑‍✈️','🧑‍🚀','🕊️','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','🈶','🈚','🈸','🈺','🈷️','🈁','🈯','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','🆔','🆚','🆅','🆆','🆇','🆈','🆉','🆊','🆋','🆌','🆍','🆎','🆏','🆐','🆑','🆒','🆓','🆔','🆕','🆖','🆗','🆘','🆙','🆚','🆛','🆜','🆝','🆞','🆟','🆠','🆡','🆢','🆣','🆤','🆥','🆦','🆧','🆨','🆩','🆪','🆫','🆬','🆭','🈁','🈯','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','🆔','🆚'],
	};


	// Crear el picker visual con categorías
	const picker = document.createElement('div');
	picker.id = 'custom-emoji-picker';
	picker.style.position = 'absolute';
	picker.style.zIndex = '12000';
	picker.style.display = 'none';
	picker.style.width = '370px';
	picker.style.maxHeight = '400px';
	picker.style.overflowY = 'auto';
	picker.style.background = '#fff';
	picker.style.border = '1px solid #ddd';
	picker.style.borderRadius = '10px';
	picker.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
	picker.style.padding = '10px';
	picker.style.fontSize = '1.7em';
	picker.style.userSelect = 'none';

	// Crear pestañas de categorías
	const tabs = document.createElement('div');
	tabs.style.display = 'flex';
	tabs.style.justifyContent = 'center';
	tabs.style.marginBottom = '10px';
	tabs.style.flexWrap = 'wrap';

	const tabButtons = {};
	const emojiPanels = {};
	let activeCategory = null;

	Object.keys(emojiCategories).forEach((cat, idx) => {
		// Botón de pestaña
		const tabBtn = document.createElement('button');
		tabBtn.type = 'button';
		tabBtn.textContent = cat;
		tabBtn.style.margin = '2px 6px';
		tabBtn.style.padding = '4px 12px';
		tabBtn.style.border = 'none';
		tabBtn.style.borderRadius = '6px';
		tabBtn.style.background = idx === 0 ? '#e0e0e0' : 'none';
		tabBtn.style.cursor = 'pointer';
		tabBtn.style.fontWeight = 'bold';
		tabBtn.style.fontSize = '0.45em';
		tabBtn.onclick = () => {
			setActiveCategory(cat);
		};
		tabs.appendChild(tabBtn);
		tabButtons[cat] = tabBtn;

		// Panel de emojis
		const panel = document.createElement('div');
		panel.style.display = idx === 0 ? 'block' : 'none';
		panel.style.flexWrap = 'wrap';
		panel.style.justifyContent = 'center';
		panel.style.alignItems = 'center';
		panel.style.marginTop = '4px';
		panel.style.marginBottom = '4px';

			emojiCategories[cat].forEach(emoji => {
				// Filtrar emojis inválidos (que aparecen como '?')
				if (emoji === '�') return;
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.textContent = emoji;
				btn.style.margin = '4px';
				btn.style.border = 'none';
				btn.style.background = 'none';
				btn.style.cursor = 'pointer';
				btn.style.outline = 'none';
				btn.style.transition = 'background 0.2s';
				btn.onmouseover = () => btn.style.background = '#f0f0f0';
				btn.onmouseout = () => btn.style.background = 'none';
				btn.onclick = () => {
					iconoInput.value = emoji;
					iconoBtn.textContent = emoji;
					picker.style.display = 'none';
				};
				panel.appendChild(btn);
			});
		picker.appendChild(panel);
		emojiPanels[cat] = panel;
	});

	picker.insertBefore(tabs, picker.firstChild);
	document.body.appendChild(picker);

	function setActiveCategory(cat) {
		Object.keys(emojiPanels).forEach(c => {
			emojiPanels[c].style.display = c === cat ? 'block' : 'none';
			tabButtons[c].style.background = c === cat ? '#e0e0e0' : 'none';
		});
		activeCategory = cat;
	}
	setActiveCategory(Object.keys(emojiCategories)[0]);

	// Mostrar el picker al hacer clic en el botón
	iconoBtn.addEventListener('click', (e) => {
		const rect = iconoBtn.getBoundingClientRect();
		picker.style.left = rect.left + 'px';
		picker.style.top = (rect.bottom + window.scrollY) + 'px';
		picker.style.display = 'block';
	});

	// Ocultar el picker al hacer clic fuera
	document.addEventListener('click', (e) => {
		if (!picker.contains(e.target) && e.target !== iconoBtn) {
			picker.style.display = 'none';
		}
	});

	// Resetear el botón al abrir el modal
	document.getElementById('modal-etiqueta').addEventListener('show.bs.modal', () => {
		iconoBtn.textContent = iconoInput.value || '🩸';
	});
});
