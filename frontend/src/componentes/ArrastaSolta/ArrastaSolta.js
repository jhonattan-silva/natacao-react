import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import ArrastaSoltaItem from '../ArrastaSoltaItem/ArrastaSoltaItem';

const ArrastaSolta = ({ itens, aoReordenar, renderItem }) => {
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = itens.findIndex((item) => item.id === active.id);
        const newIndex = itens.findIndex((item) => item.id === over.id);
        aoReordenar(arrayMove(itens, oldIndex, newIndex));
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itens} strategy={verticalListSortingStrategy}>
                <ul>
                    {itens.map((item) => (
                        <ArrastaSoltaItem key={item.id} id={item.id}>
                            {renderItem ? renderItem(item) : item.label || item.nome} {/* Permite personalizar o conteúdo */}
                        </ArrastaSoltaItem>
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
};

export default ArrastaSolta;
