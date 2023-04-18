type ModalProps = {
    children: React.ReactNode
}

const CustomModal = ({children}: ModalProps) => {
    return(
        <div>
            <div className="absolute top-0 bottom-0 right-0 left-0 backdrop-blur-sm h-screen text-white grid place-items-center"></div>
            <div className="absolute left-1/2 top-1/2 right-auto bottom-auto translate-x-[-50%] translate-y-[-50%] bg-[rgba(255, 255, 255, 0.06)] border-2 border-[#625965] backdrop-blur-2xl w-[30rem] rounded-3xl"> 
                {children}
            </div>
        </div>
        
    )
}


export default CustomModal