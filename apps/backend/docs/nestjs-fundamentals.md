# NestJS Fundamentals

This document explains the core concepts and building blocks of NestJS, a progressive Node.js framework for building efficient and scalable server-side applications.

## Table of Contents

1. [Dependency Injection (DI)](#dependency-injection-di)
2. [Decorators](#decorators)
3. [Modules](#modules)
4. [Providers](#providers)
5. [Services](#services)
6. [Interceptors](#interceptors)

---

## Dependency Injection (DI)

### What is Dependency Injection?

Dependency Injection is a design pattern where a class receives its dependencies from external sources rather than creating them itself. NestJS has a built-in DI container that manages the creation and lifecycle of dependencies.

### How It Works in NestJS

```typescript
@Injectable()
export class BreedService {
	findAll() {
		return "All dogs";
	}
}

@Controller("dogs")
export class BreedController {
	// BreedService is automatically injected by NestJS
	constructor(private readonly dogsService: BreedService) {}

	@Get()
	findAll() {
		return this.dogsService.findAll();
	}
}
```

### Key Benefits

- **Loose Coupling**: Classes don't depend on concrete implementations
- **Testability**: Easy to mock dependencies in unit tests
- **Maintainability**: Changes to dependencies don't require changing dependent classes
- **Reusability**: Services can be shared across multiple modules

### Important Note

**Never use `import type` for classes that need to be injected!** Type-only imports are erased at runtime, causing DI to fail.

```typescript
// ❌ WRONG - Type-only import (erased at runtime)
import type { BreedService } from "./dogs.service";

// ✅ CORRECT - Regular import (available at runtime)
import { BreedService } from "./dogs.service";
```

---

## Decorators

### What are Decorators?

Decorators are special declarations that attach metadata to classes, methods, properties, or parameters. They're a TypeScript feature extensively used by NestJS to define behavior and configuration.

### Common NestJS Decorators

#### Class Decorators

```typescript
// Marks a class as a NestJS module
@Module({
	imports: [],
	controllers: [BreedController],
	providers: [BreedService],
})
export class BreedModule {}

// Marks a class as a controller (handles HTTP requests)
@Controller("dogs")
export class BreedController {}

// Marks a class as a provider (can be injected)
@Injectable()
export class BreedService {}
```

#### Method Decorators

```typescript
@Controller("dogs")
export class BreedController {
	// HTTP method decorators
	@Get() // Handle GET requests
	@Post() // Handle POST requests
	@Put(":id") // Handle PUT requests with route parameter
	@Delete(":id") // Handle DELETE requests
	@Patch(":id") // Handle PATCH requests

	// Swagger/OpenAPI documentation
	@ApiOperation({ summary: "Get all dogs" })
	@ApiResponse({ status: 200, description: "Returns all dogs" })
	findAll() {}
}
```

#### Parameter Decorators

```typescript
@Controller("dogs")
export class BreedController {
	@Get(":id")
	findOne(
		@Param("id") id: string, // Extract route parameter
		@Query("limit") limit?: number, // Extract query parameter
		@Body() createDogDto: CreateDogDto, // Extract request body
		@Headers() headers: any, // Extract all headers
		@Req() request: Request, // Get full request object
		@Res() response: Response, // Get full response object
	) {
		return `Dog ${id} with limit ${limit}`;
	}
}
```

---

## Modules

### What is a Module?

A module is a class annotated with `@Module()` decorator. Modules organize the application structure by grouping related controllers, providers, and other modules together.

### Module Structure

```typescript
@Module({
	imports: [OtherModule], // Import other modules
	controllers: [BreedController], // Controllers defined in this module
	providers: [BreedService], // Services/providers available in this module
	exports: [BreedService], // Make providers available to other modules
})
export class BreedModule {}
```

### Key Properties

- **imports**: Other modules whose providers are needed in this module
- **controllers**: Controllers that belong to this module
- **providers**: Services and other providers that can be injected
- **exports**: Providers that should be available to other modules that import this module

### Module Example

```typescript
// dogs.module.ts
@Module({
	imports: [DatabaseModule], // Import database functionality
	controllers: [BreedController],
	providers: [BreedService, BreedRepository],
	exports: [BreedService], // Other modules can use BreedService
})
export class BreedModule {}

// app.module.ts (root module)
@Module({
	imports: [
		BreedModule, // Import BreedModule to use its exported providers
		CatsModule,
		UsersModule,
	],
})
export class AppModule {}
```

### Best Practices

- Keep modules focused on a single domain or feature
- Use feature modules to organize related functionality
- Export only what other modules need to consume
- Use shared modules for common utilities

---

## Providers

### What is a Provider?

A provider is a class that can be injected as a dependency. Most NestJS classes are providers: services, repositories, factories, helpers, etc.

### Declaring a Provider

```typescript
// Mark with @Injectable() decorator
@Injectable()
export class BreedService {
	findAll() {
		return ["Dog 1", "Dog 2"];
	}
}

// Register in module
@Module({
	providers: [BreedService], // Shorthand syntax
})
export class BreedModule {}
```

### Provider Registration Patterns

```typescript
@Module({
	providers: [
		// Standard class provider (most common)
		BreedService,

		// Equivalent to:
		{
			provide: BreedService,
			useClass: BreedService,
		},

		// Value provider
		{
			provide: "API_KEY",
			useValue: process.env.API_KEY,
		},

		// Factory provider
		{
			provide: "DATABASE_CONNECTION",
			useFactory: async (config: ConfigService) => {
				return createConnection(config.get("database"));
			},
			inject: [ConfigService],
		},

		// Existing provider (alias)
		{
			provide: "BreedServiceAlias",
			useExisting: BreedService,
		},
	],
})
export class BreedModule {}
```

### Provider Scope

```typescript
// Default: SINGLETON (shared across the entire app)
@Injectable()
export class BreedService {}

// REQUEST scope (new instance per request)
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {}

// TRANSIENT scope (new instance each time it's injected)
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

---

## Services

### What is a Service?

A service is a type of provider that contains business logic. Services are typically injected into controllers and other services to perform operations.

### Service Example

```typescript
@Injectable()
export class BreedService {
	private dogs = [];

	// Business logic methods
	findAll() {
		return this.dogs;
	}

	findOne(id: string) {
		return this.dogs.find((dog) => dog.id === id);
	}

	create(createDogDto: CreateDogDto) {
		const newDog = {
			id: Date.now().toString(),
			...createDogDto,
		};
		this.dogs.push(newDog);
		return newDog;
	}

	update(id: string, updateDogDto: UpdateDogDto) {
		const dogIndex = this.dogs.findIndex((dog) => dog.id === id);
		if (dogIndex > -1) {
			this.dogs[dogIndex] = { ...this.dogs[dogIndex], ...updateDogDto };
			return this.dogs[dogIndex];
		}
		return null;
	}

	delete(id: string) {
		const dogIndex = this.dogs.findIndex((dog) => dog.id === id);
		if (dogIndex > -1) {
			return this.dogs.splice(dogIndex, 1)[0];
		}
		return null;
	}
}
```

### Service with Dependencies

```typescript
@Injectable()
export class BreedService {
	constructor(
		private readonly dogsRepository: BreedRepository,
		private readonly logger: LoggerService,
		@Inject("API_KEY") private readonly apiKey: string,
	) {}

	async findAll() {
		this.logger.log("Finding all dogs");
		return this.dogsRepository.findAll();
	}
}
```

### Best Practices

- Keep services focused on a single responsibility
- Services should contain business logic, not HTTP-specific code
- Use repositories for data access, keep services for business rules
- Services should be easily testable with mocked dependencies

---

## Interceptors

### What is an Interceptor?

Interceptors are classes that can intercept incoming requests or outgoing responses. They implement the `NestInterceptor` interface and can perform operations before and after method execution.

### Use Cases

- Transform response data
- Log request/response
- Add extra properties to responses
- Handle caching
- Measure execution time
- Error handling and transformation

### Basic Interceptor Example

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, map } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const now = Date.now();
		const request = context.switchToHttp().getRequest();

		console.log(`Before... ${request.method} ${request.url}`);

		return next.handle().pipe(tap(() => console.log(`After... ${Date.now() - now}ms`)));
	}
}
```

### Transform Response Interceptor

```typescript
interface Response<T> {
	data: T;
	timestamp: string;
	statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
	intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
		return next.handle().pipe(
			map((data) => ({
				data,
				timestamp: new Date().toISOString(),
				statusCode: context.switchToHttp().getResponse().statusCode,
			})),
		);
	}
}
```

### Applying Interceptors

```typescript
// Global interceptor (applies to all routes)
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalInterceptors(new LoggingInterceptor());
	await app.listen(3000);
}

// Controller-level interceptor
@Controller("dogs")
@UseInterceptors(LoggingInterceptor)
export class BreedController {}

// Method-level interceptor
@Controller("dogs")
export class BreedController {
	@Get()
	@UseInterceptors(TransformInterceptor)
	findAll() {
		return [];
	}
}
```

### Execution Order

When multiple interceptors are applied, they execute in a specific order:

1. **Request Flow** (top to bottom):
   - Global interceptors
   - Controller-level interceptors
   - Method-level interceptors
   - Route handler executes

2. **Response Flow** (bottom to top):
   - Method-level interceptors
   - Controller-level interceptors
   - Global interceptors

### Cache Interceptor Example

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
	private cache = new Map();

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const key = request.url;

		if (this.cache.has(key)) {
			console.log("Returning cached response");
			return of(this.cache.get(key));
		}

		return next.handle().pipe(
			tap((response) => {
				console.log("Caching response");
				this.cache.set(key, response);
			}),
		);
	}
}
```

### Timeout Interceptor Example

```typescript
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
	constructor(private readonly timeout: number = 5000) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			timeout(this.timeout),
			catchError((err) => {
				if (err instanceof TimeoutError) {
					throw new RequestTimeoutException("Request took too long");
				}
				throw err;
			}),
		);
	}
}
```

---

## Summary

### Dependency Injection

- Automatic management of class dependencies
- Promotes loose coupling and testability
- **Critical**: Use regular imports, never `import type` for injectable classes

### Decorators

- Add metadata to classes, methods, and parameters
- Define routes, HTTP methods, validation, and more
- Make code declarative and clean

### Modules

- Organize application into cohesive blocks
- Group related controllers and providers
- Control visibility with imports/exports

### Providers

- Injectable dependencies (services, repositories, etc.)
- Registered in module's `providers` array
- Can have different scopes (singleton, request, transient)

### Services

- Specific type of provider containing business logic
- Should be framework-agnostic and easily testable
- Handle domain-specific operations

### Interceptors

- Intercept requests/responses for cross-cutting concerns
- Transform data, log, cache, or measure performance
- Execute in a predictable order (global → controller → method)

---

## Additional Resources

- [Official NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Fundamentals Course](https://docs.nestjs.com/fundamentals)
- [Dependency Injection in NestJS](https://docs.nestjs.com/fundamentals/custom-providers)
- [NestJS Interceptors Guide](https://docs.nestjs.com/interceptors)
