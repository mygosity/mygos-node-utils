interface EventObject {
	event: (...args: any[]) => any;
	callback?: (...args: any[]) => any;
}

export class EventManager {
	registeredEvents: Map<number | string, EventObject[]> = new Map();

	/**
	 * Calling this will force all callbacks listening to the eventId to fire
	 * along with any arguments you've specified in both the addEventListener event and this one
	 * @param {Events} eventId an enum string which triggers all callbacks listening to the id
	 * @param {...any} args optional arguments that are added to the callback arguments
	 */
	emit = (eventId: number | string, ...args: any[]) => {
		if (!this.registeredEvents.has(eventId)) return;
		const eventList = this.registeredEvents.get(eventId);
		if (!eventList) return;
		for (const eventObject of eventList) {
			eventObject.event(...args);
		}
	};

	/**
	 * Add an event listener to dispatch from anywhere within the application
	 * Adding the same callback to an event registered before will replace it with the latest
	 * @param {Events} eventId an enum string which triggers the callback
	 * @param {function} callback function that is called when the event id is dispatched
	 * @param {...any} args additional optional arguments to pass to the callback
	 */
	add = (eventId: number | string, callback: (...args: any[]) => any, ...args: any[]) => {
		if (!this.registeredEvents.has(eventId)) {
			this.registeredEvents.set(eventId, []);
		}
		const list = this.registeredEvents.get(eventId) as EventObject[];
		const index = list.findIndex((ref: EventObject) => ref.callback === callback);
		list[index > -1 ? index : list.length] = {
			event: function (...wrappedArgument: any[]) {
				callback(...args, ...wrappedArgument);
			},
			//stored for reference removal in remove
			callback,
		};
	};

	/**
	 * Remove a callback from listening to a particular event id
	 * @param {Events} eventId an enum string which triggers the callback
	 * @param {function} callback function that is called when the event id is dispatched
	 */
	remove = (eventId: number | string, callback: Function) => {
		if (!this.registeredEvents.has(eventId)) return;
		const eventList = this.registeredEvents.get(eventId);
		if (!eventList) return;
		for (let i = eventList.length - 1; i >= 0; --i) {
			if (callback === eventList[i].callback) {
				eventList.splice(i, 1);
				break;
			}
		}
		if (eventList.length === 0) {
			this.registeredEvents.delete(eventId);
		}
	};

	dispose = () => {
		for (const eventId of this.registeredEvents.keys()) {
			this.registeredEvents.delete(eventId);
		}
		this.registeredEvents.clear();
	};
}
