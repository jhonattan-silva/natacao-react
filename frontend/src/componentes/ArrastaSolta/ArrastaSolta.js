import { useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import ArrastaSoltaItem from "../ArrastaSoltaItem/ArrastaSoltaItem";

const ArrastaSolta = ({ itens, aoReordenar, renderItem }) => {
    useEffect(() => {
        console.log("📌 Itens iniciais recebidos no ArrastaSolta:", itens);
    }, [itens]); // 🔥 Executa apenas quando `itens` muda

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = itens.findIndex((item) => item.id === active.id);
        const newIndex = itens.findIndex((item) => item.id === over.id);

        const novosItens = arrayMove(itens, oldIndex, newIndex).map((item, index) => ({
            ...item,
            ordem: index + 1, // Garante que a ordem está correta
        }));

        console.log("📌 Nova ordem após movimentação:", novosItens);
        aoReordenar(novosItens);
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext key={JSON.stringify(itens)} items={itens} strategy={verticalListSortingStrategy}>
                <ol>
                    {itens.map((item, index) => (
                        <ArrastaSoltaItem key={item.id} id={item.id}>
                            {index + 1}. {renderItem ? renderItem(item) : `${item.label || item.nome} (${item.sexo})`}
                        </ArrastaSoltaItem>
                    ))}
                </ol>
            </SortableContext>
        </DndContext>
    );
};

export default ArrastaSolta;
