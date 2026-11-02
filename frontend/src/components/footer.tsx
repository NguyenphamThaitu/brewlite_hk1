export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto bg-[#0b2d40] text-white">
            <div className="mx-auto max-w-5xl px-6 py-8">
                <div>
                    <span className="text-xl font-bold tracking-widest text-[#c4956a]">
                        BREWLITE
                    </span>
                    <p className="mt-1 text-sm text-gray-400">
                        Ứng dụng đặt đồ uống tiện lợi
                    </p>
                </div>

                <hr className="my-6 border-[#1a4a6b]" />

                <p className="text-center text-xs text-gray-500">
                    © {year} BrewLite — Nhóm sinh viên thực hành kỹ thuật phần mềm.
                </p>
            </div>
        </footer>
    );
}
