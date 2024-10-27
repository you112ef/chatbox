import { Loader } from 'lucide-react'

export default function MessageLoading(props: { children: React.ReactNode }) {
    const { children } = props
    return (
        <div className='flex flex-row items-start justify-start overflow-x-auto overflow-y-hidden'>
            <div className='flex justify-start items-center mb-1 px-1 py-2
                                                    border-solid border-blue-400/20 shadow-md rounded-lg
                                                    bg-blue-100
                                                    '
            >
                <Loader className='w-6 h-6 ml-1 mr-2 text-black animate-spin' />
                <span className='mr-4 animate-pulse font-bold text-gray-800/70'>
                    {children}
                </span>
            </div>
        </div>
    )
}
