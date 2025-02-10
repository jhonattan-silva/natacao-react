import { useEffect, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import ArrastaSoltaItem from "../ArrastaSoltaItem/ArrastaSoltaItem";

/* ArrastaSolta
*   Componente que permite arrastar e soltar itens em uma lista ordenada
*   @param {Array} itens - Lista de itens a serem exibidos
*   @param {Function} aoReordenar - Função a ser executada ao reordenar os itens
*   @param {Function} renderItem - Função para renderizar cada item
*   @param {String} ordenarPor - Campo pelo qual os itens devem ser ordenados
*/
const ArrastaSolta = ({ itens, aoReordenar, renderItem, ordenarPor = null }) => {
    // Usa `useMemo` para garantir que os itens são ordenados antes da renderização
    const itensOrdenados = useMemo(() => { 
        // Ordena os itens de acordo com o campo especificado
        return ordenarPor ? [...itens].sort((a, b) => a[ordenarPor] - b[ordenarPor]) : [...itens];
    }, [itens, ordenarPor]); // Atualiza a ordenação quando os itens ou o campo de ordenação mudam

    useEffect(() => {
        console.log("📌 Itens ordenados antes da renderização no ArrastaSolta:", itensOrdenados);
    }, [itensOrdenados]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = itensOrdenados.findIndex((item) => item.id === active.id);
        const newIndex = itensOrdenados.findIndex((item) => item.id === over.id);

        const novosItens = arrayMove(itensOrdenados, oldIndex, newIndex).map((item, index) => ({
            ...item,
            ...(ordenarPor && { [ordenarPor]: index + 1 }),
        }));

        console.log("📌 Nova ordem após movimentação:", novosItens);
        aoReordenar(novosItens);
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext key={JSON.stringify(itensOrdenados)} items={itensOrdenados} strategy={verticalListSortingStrategy}>
                <ol>
                    {itensOrdenados.map((item) => (
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
