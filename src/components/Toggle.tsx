interface P { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }
export default function Toggle({ checked, onChange, disabled }: P) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-[50px] h-[30px] rounded-full transition-colors ${disabled ? 'opacity-40' : ''} ${checked ? 'bg-[#FF5252]' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}
