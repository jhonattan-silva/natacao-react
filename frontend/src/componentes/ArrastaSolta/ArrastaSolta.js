import { useEffect, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import ArrastaSoltaItem from "../ArrastaSoltaItem/ArrastaSoltaItem";

const ArrastaSolta = ({ itens, aoReordenar, renderItem, ordenarPor = null }) => {
    // 🔥 Se ordenarPor for fornecido, ordena pelo campo especificado. Senão, mantém a ordem original.
    const itensOrdenados = useMemo(() => {
        return ordenarPor ? [...itens].sort((a, b) => a[ordenarPor] - b[ordenarPor]) : [...itens];
    }, [itens, ordenarPor]);

    useEffect(() => {
        console.log("📌 Itens iniciais recebidos no ArrastaSolta:", itensOrdenados);
    }, [itensOrdenados]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = itensOrdenados.findIndex((item) => item.id === active.id);
        const newIndex = itensOrdenados.findIndex((item) => item.id === over.id);

        const novosItens = arrayMove(itensOrdenados, oldIndex, newIndex).map((item, index) => ({
            ...item,
            ...(ordenarPor && { [ordenarPor]: index + 1 }), // 🔥 Atualiza a ordem apenas se `ordenarPor` for fornecido
        }));

        console.log("📌 Nova ordem após movimentação:", novosItens);
        aoReordenar(novosItens);
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext key={JSON.stringify(itensOrdenados)} items={itensOrdenados} strategy={verticalListSortingStrategy}>
                <ol>
                    {itensOrdenados.map((item, index) => (
                        <ArrastaSoltaItem key={item.id} id={item.id}>
                            {renderItem ? renderItem(item) : `${item.label || item.nome}`}
                        </ArrastaSoltaItem>
                    ))}
                </ol>
            </SortableContext>
        </DndContext>
    );
};

export default ArrastaSolta;
