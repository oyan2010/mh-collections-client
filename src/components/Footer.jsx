export default function Footer() {
    return (
        <div className="bg-off-white dark:bg-zinc-900 py-12 px-5 text-center">
            <h4 className="text-lg font-bold mb-2">Join the Inner Circle</h4>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Exclusive access to new collections and private sales.
            </p>
            <div className="flex max-w-sm mx-auto border-b border-primary">
                <input
                    className="w-full bg-transparent border-none text-sm px-0 py-3 focus:ring-0 placeholder:text-gray-400"
                    placeholder="Email Address"
                    type="email"
                />
                <button className="text-sm font-bold uppercase tracking-wider pl-4">Join</button>
            </div>
        </div>
    );
}
