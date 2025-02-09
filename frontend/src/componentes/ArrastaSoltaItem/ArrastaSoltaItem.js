import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ArrastaSoltaItem = ({ id, index, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        padding: '10px',
        border: '1px solid black',
        marginBottom: '5px',
        backgroundColor: '#f0f0f0',
        cursor: 'grab',
    };

    return (
        <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {index}. {children}
        </li>
    );
};

export default ArrastaSoltaItem;
