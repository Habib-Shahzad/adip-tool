// import React, { useState, useEffect } from "react";
// import Modal from "./components/Modal";
// import axios from "axios";

// const App = () => {
//   const [todoList, setTodoList] = useState([]);
//   const [modal, setModal] = useState(false);
//   const [activeItem, setActiveItem] = useState({
//     title: "",
//     description: "",
//     completed: false,
//   });

//   useEffect(() => {
//     refreshList();
//   }, []);

//   const refreshList = () => {
//     axios
//       .get("http://localhost:8000/api/todos/")
//       .then((res) => setTodoList(res.data))
//       .catch((err) => console.log(err));
//   };

//   const toggle = () => setModal(!modal);
//   const handleSubmit = (item) => {
//     toggle();
//     if (item.id) {
//       axios
//         .put(`http://localhost:8000/api/todos/${item.id}/`, item)
//         .then((res) => refreshList());
//       return;
//     }
//     axios
//       .post("http://localhost:8000/api/todos/", item)
//       .then((res) => refreshList());
//   };
//   const handleDelete = (item) => {
//     axios
//       .delete(`http://localhost:8000/api/todos/${item.id}/`)
//       .then((res) => refreshList());
//   };
//   const createItem = () => {
//     const item = { title: "", description: "", completed: false };
//     setActiveItem(item);
//     toggle();
//   };
//   const editItem = (item) => {
//     setActiveItem(item);
//     toggle();
//   };
//   const deleteItem = (item) => {
//     handleDelete(item);
//   };


//   return (
//     <main className="content">
//       <h1 className="text-white text-uppercase text-center my-4">Todo app</h1>
//       <div className="row ">

//         <div className="col-md-6 col-sm-10 mx-auto p-0">
//           <div className="card p-3">
//             <div className="">

//               <button
//                 onClick={createItem}
//                 className="btn btn-primary"
//               >
//                 Add task
//               </button>
//             </div>
//             {todoList.map((item) => (

//               <div
//                 key={item.id}
//                 className="card p-3 my-3 d-flex justify-content-between align-items-center"
//               >
//                 <span
//                   className={`todo-title mr-2 ${item.completed ? "completed-todo" : ""
//                     }`}
//                   title={item.description}
//                 >
//                   {item.title}
//                 </span>
//                 <div>
//                   <button
//                     className="btn btn-secondary mr-2"
//                     onClick={() => editItem(item)}
//                   >
//                     {" "}
//                     Edit{" "}
//                   </button>
//                   <button
//                     className="btn btn-danger"
//                     onClick={() => deleteItem(item)}
//                   >
//                     Delete{" "}
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       {modal ? (

//         <Modal
//           activeItem={activeItem}
//           toggle={toggle}
//           onSave={handleSubmit}
//         />
//       ) : null}
//     </main>
//   );

// }
