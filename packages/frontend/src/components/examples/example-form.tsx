'use client';

// 这是 PM 写表单时的参照模板：React Hook Form + Zod。
// 实际业务表单按此模式复制：定义 schema → useForm(resolver) → handleSubmit。
// 规则：禁止使用原始 HTML form + 手写 onChange。

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong').max(20, 'Maksimal 20 karakter'),
  greeting: z.string().min(5, 'Sapaan minimal 5 karakter').max(200),
});

type FormValues = z.infer<typeof schema>;

export function ExampleForm({
  onSubmit,
}: {
  onSubmit: (values: FormValues) => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', greeting: '' },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="name">
          Nama karakter
        </label>
        <input
          id="name"
          className={cn(
            'w-full rounded-md border bg-background px-3 py-2 text-sm',
            errors.name ? 'border-destructive' : 'border-input'
          )}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="greeting">
          Sapaan pembuka
        </label>
        <textarea
          id="greeting"
          rows={3}
          className={cn(
            'w-full rounded-md border bg-background px-3 py-2 text-sm',
            errors.greeting ? 'border-destructive' : 'border-input'
          )}
          {...register('greeting')}
        />
        {errors.greeting && <p className="text-xs text-destructive">{errors.greeting.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Mengirim...' : 'Kirim'}
      </Button>
    </form>
  );
}
