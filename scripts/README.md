
参考信息，SuiEventFilter

```typescript
/**
 * Sequential event ID, ie (transaction seq number, event seq number).
 * 1) Serves as a unique event ID for each fullnode
 * 2) Also serves to sequence events for the purposes of pagination and querying.
 *    A higher id is an event seen later by that fullnode.
 * This ID is the "cursor" for event querying.
 */
export type EventId = Infer<typeof EventId>;

// mirrors sui_json_rpc_types::SuiEventFilter
export type SuiEventFilter =
	| { Package: ObjectId }
	| { MoveModule: { package: ObjectId; module: string } }
	| { MoveEventType: string }
	| { MoveEventField: MoveEventField }
	| { Transaction: TransactionDigest }
	| {
			TimeRange: {
				// left endpoint of time interval, milliseconds since epoch, inclusive
				startTime: string;
				// right endpoint of time interval, milliseconds since epoch, exclusive
				endTime: string;
			};
	  }
	| { Sender: SuiAddress }
	| { All: SuiEventFilter[] }
	| { Any: SuiEventFilter[] }
	| { And: [SuiEventFilter, SuiEventFilter] }
	| { Or: [SuiEventFilter, SuiEventFilter] };

export const PaginatedEvents = object({
	data: array(SuiEvent),
	nextCursor: nullable(EventId),
	hasNextPage: boolean(),
});
export type PaginatedEvents = Infer<typeof PaginatedEvents>;

```