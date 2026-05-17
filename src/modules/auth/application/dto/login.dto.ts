export class LoginDto {
	constructor(
		public readonly correo: string,
		public readonly password: string,
	) {}
}
