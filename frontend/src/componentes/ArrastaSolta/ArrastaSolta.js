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
                <ol>
                    {itens.map((item, index) => (
                        <ArrastaSoltaItem key={item.id} id={item.id}>
                            {index + 1}. {renderItem ? renderItem(item) : `${item.label || item.nome} (${item.sexo})`} {/* Permite personalizar o conteúdo */}
                        </ArrastaSoltaItem>
                    ))}
                </ol>
            </SortableContext>
        </DndContext>
    );
};

export default ArrastaSolta;
