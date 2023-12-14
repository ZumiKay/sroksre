import { Selection } from "./Button"


export const CreateForm = async () => {
return (
    <form className="createForm">
        <input name="name" type="text" className="p-name" required/>
        <input name="price" type="text" className="p-price" required/>
        

    </form>
)
}



