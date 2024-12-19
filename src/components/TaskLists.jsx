import { useState, useEffect } from "react";
import { MdAdd, MdDelete } from "react-icons/md";
import { db } from '../firebase.js';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import SignOut from "./SignOut.jsx";

const TaskLists = () => {
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const collectionRef = collection(db, 'tasks');
            const querySnapshot = await getDocs(collectionRef);
            const taskList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTasks(taskList);
        } catch (error) {
            console.error("Error fetching tasks: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!title || !description) {
            setError("Both fields are required.");
            return;
        }
        try {
            const newTask = {
                title,
                description,
                status: "pending",
            };
            await addDoc(collection(db, "tasks"), newTask);
            setTasks((prevTasks) => [...prevTasks, { ...newTask, id: Date.now().toString() }]); // Optimistic UI update
            setTitle("");
            setDescription("");
            setError("");
            fetchTasks(); // Sync with Firestore
        } catch (error) {
            console.error("Error adding task: ", error);
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            const taskRef = doc(db, "tasks", id);
            await deleteDoc(taskRef);
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
        } catch (error) {
            console.error("Error deleting task: ", error);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const taskRef = doc(db, "tasks", id);
            const updatedStatus = status === "pending" ? "completed" : "pending";
            await updateDoc(taskRef, { status: updatedStatus });
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === id ? { ...task, status: updatedStatus } : task
                )
            );
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="task-lists-container">
            <h2>Task List</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleAddTask} className="add-task-form">
                <input
                    type="text"
                    placeholder="Task Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="input-field"
                />
                <textarea
                    placeholder="Task Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="textarea-field"
                />
                <button type="submit" className="add-btn">
                    <MdAdd /> Add Task
                </button>
            </form>
            <ul className="task-list">
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        className={`task-item ${task.status === "completed" ? "completed" : "pending"}`}
                    >
                        <p>
                            <strong>Title:</strong> {task.title}
                        </p>
                        <p>
                            <strong>Description:</strong> {task.description}
                        </p>
                        <p>
                            <strong>Status:</strong> {task.status}
                        </p>
                        <button
                            onClick={() => handleStatusChange(task.id, task.status)}
                            className="status-btn"
                        >
                            {task.status === "pending" ? "Mark as Completed" : "Mark as Pending"}
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="delete-btn">
                            <MdDelete /> Delete
                        </button>
                    </li>
                ))}
            </ul>
            <SignOut/>
        </div>
    );
};

export default TaskLists;
