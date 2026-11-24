import React, { useMemo, useState } from 'react';

import { describeSeats, seatsInRow } from '@/lib/stadiumBowl';

/**
 * SeatPicker — the keyboard and screen-reader way to pick seats in a block.
 *
 * The 3D map is a pointer surface; this lists the same seats as a row select
 * and a seat select, over the same seat map, so every seat the map offers can
 * be picked without it. Picked seats are chips with a remove button.
 *
 * Props:
 *   seatMap   object — `fan.tickets.blocks.seats` payload.
 *   selected  array  — [{ row, number }].
 *   onToggle  fn     — ({ row, number }) adds or removes one seat.
 *   max       number — most seats one order may take.
 */
export default function SeatPicker({ seatMap, selected, onToggle, max = 10 }) {
    const grid = { rows: seatMap.rows, perRow: seatMap.per_row, lastRow: seatMap.last_row };
    const taken = useMemo(() => new Set(seatMap.taken || []), [seatMap]);
    const picked = new Set(selected.map((s) => `${s.row}:${s.number}`));

    const freeIn = (row) => {
        const out = [];
        for (let n = 1; n <= seatsInRow(grid, row); n += 1) {
            const key = `${row}:${n}`;
            if (!taken.has(key) && !picked.has(key)) out.push(n);
        }
        return out;
    };

    const rows = [];
    for (let r = 1; r <= grid.rows; r += 1) {
        const free = freeIn(r).length;
        if (free) rows.push({ row: r, free });
    }

    const [row, setRow] = useState(rows[0]?.row ?? '');
    const activeRow = rows.some((r) => r.row === Number(row)) ? Number(row) : rows[0]?.row;
    const seatsHere = activeRow ? freeIn(activeRow) : [];
    const [number, setNumber] = useState('');
    const activeNumber = seatsHere.includes(Number(number)) ? Number(number) : seatsHere[0];
    const full = selected.length >= max;

    return (
        <div className="seat-picker">
            <p className="tfe-form-label" id="seat-picker-label">
                Seats in block {seatMap.code}
                <span className="seat-picker__left"> · {seatMap.remaining} left</span>
            </p>

            {rows.length === 0 ? (
                <p className="tfe-form-help">No free seats left in this block.</p>
            ) : (
                <div className="seat-picker__controls" role="group" aria-labelledby="seat-picker-label">
                    <label className="seat-picker__field">
                        <span>Row</span>
                        <select className="tfe-select tfe-select--sm" value={activeRow} onChange={(e) => setRow(e.target.value)}>
                            {rows.map((r) => (
                                <option key={r.row} value={r.row}>Row {r.row} ({r.free} free)</option>
                            ))}
                        </select>
                    </label>
                    <label className="seat-picker__field">
                        <span>Seat</span>
                        <select className="tfe-select tfe-select--sm" value={activeNumber} onChange={(e) => setNumber(e.target.value)}>
                            {seatsHere.map((n) => <option key={n} value={n}>Seat {n}</option>)}
                        </select>
                    </label>
                    <button
                        type="button"
                        className="tfe-btn tfe-btn--sm"
                        disabled={full || !activeNumber}
                        onClick={() => onToggle({ row: activeRow, number: activeNumber })}
                    >
                        <i className="fas fa-plus" aria-hidden="true" /> Add seat
                    </button>
                </div>
            )}

            {selected.length > 0 ? (
                <>
                    <ul className="seat-picker__chips" aria-label="Your seats">
                        {selected.map((s) => (
                            <li key={`${s.row}:${s.number}`} className="tfe-pill tfe-pill--info">
                                Row {s.row} · Seat {s.number}
                                <button
                                    type="button"
                                    className="seat-picker__remove"
                                    onClick={() => onToggle(s)}
                                    aria-label={`Remove row ${s.row}, seat ${s.number}`}
                                >
                                    <i className="fas fa-times" aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    <p className="tfe-form-help">{describeSeats(selected)}{full && ` · ${max} is the most per order`}</p>
                </>
            ) : (
                <p className="tfe-form-help">
                    Pick seats here or on the map, or skip this and we will seat you together in the
                    best seats left.
                </p>
            )}
        </div>
    );
}
