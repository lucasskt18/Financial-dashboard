import { formatShortDate } from "../domain/dates.ts";
import type { Movement } from "../domain/types.ts";
import { Money } from "./Money.tsx";

export function MovementTable({
  movements,
  onEdit,
  onDelete,
  empty,
}: {
  movements: Movement[];
  onEdit: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
  empty: string;
}) {
  if (movements.length === 0) return <p className="empty">{empty}</p>;

  return (
    <table className="list">
      <thead>
        <tr>
          <th>Data</th>
          <th>Categoria</th>
          <th>Descrição</th>
          <th>Valor</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id}>
            <td>{formatShortDate(movement.date)}</td>
            <td>{movement.category}</td>
            <td>{movement.description || "—"}</td>
            <td className={movement.kind === "saida" || movement.flow === "resgate" ? "neg" : "pos"}>
              {movement.kind === "saida" ? (
                <Money cents={movement.amountCents} />
              ) : (
                <Money cents={movement.flow === "resgate" ? -movement.amountCents : movement.amountCents} signed />
              )}
            </td>
            <td className="row-actions">
              <button type="button" onClick={() => onEdit(movement)}>
                Editar
              </button>
              <button type="button" onClick={() => onDelete(movement)}>
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
