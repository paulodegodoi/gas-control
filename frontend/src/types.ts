export type Apartment = {
	id: string;
	number: string;
	name: string;
	isActive: boolean;
};

export type Reading = {
	id: string;
	apartmentId: string;
	month: string;
	previousReading: number;
	currentReading: number;
};
