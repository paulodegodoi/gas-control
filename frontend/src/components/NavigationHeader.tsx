type NavigationHeaderProps = {
	activeModule: 'gas' | 'water';
	setActiveModule: (module: 'gas' | 'water') => void;
};

export default function NavigationHeader({ activeModule, setActiveModule }: NavigationHeaderProps) {
	return (
		<div className="flex space-x-4 mb-4">
			<button
				onClick={() => setActiveModule('gas')}
				className={`px-6 py-2 rounded-t-lg font-bold transition-all border-b-4 ${
					activeModule === 'gas'
						? 'border-green-500 text-green-700 bg-white shadow-sm'
						: 'border-transparent text-slate-500 hover:bg-slate-100'
				}`}
			>
				Gás Control 🌿
			</button>
			<button
				onClick={() => setActiveModule('water')}
				className={`px-6 py-2 rounded-t-lg font-bold transition-all border-b-4 ${
					activeModule === 'water'
						? 'border-blue-500 text-blue-700 bg-white shadow-sm'
						: 'border-transparent text-slate-500 hover:bg-slate-100'
				}`}
			>
				Water Control 💧
			</button>
		</div>
	);
}
