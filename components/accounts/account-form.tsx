"use client";

/**
 * Strategy-First Account Form
 *
 * 단순 정보 입력이 아닌, 영업 전략(Tier, Status)을 함께 수립하는 폼입니다.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Account } from "@/types/database.types";

// --- Schema Definition ---
const accountFormSchema = z.object({
  name: z.string().min(1, "병원명을 입력해주세요"),
  type: z.enum(["general_hospital", "hospital", "clinic", "pharmacy"]),

  // 전략적 필드 추가
  tier: z.enum(["S", "A", "B", "C"]),
  status: z.enum(["active", "churned", "prospect"]),

  address: z.string().optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  notes: z.string().optional(),
});

export type AccountFormData = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel?: () => void;
}

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: account
      ? {
          name: account.name,
          type: account.type,
          // RISK를 C로 매핑 (기존 데이터 호환성)
          tier: account.tier === "RISK" ? "C" : account.tier,
          // Account 타입에 status 필드가 없으므로 기본값 사용
          status: "prospect",
          address: account.address || "",
          phone: account.phone || "",
          specialty: account.specialty || "",
          notes: account.notes || "",
        }
      : {
          name: "",
          type: "clinic",
          tier: "B",
          status: "prospect",
          address: "",
          phone: "",
          specialty: "",
          notes: "",
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 1. 기본 정보 */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            기본 정보
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>병원명 *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="예: 서울대학교병원" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>유형</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general_hospital">종합병원</SelectItem>
                      <SelectItem value="hospital">병원</SelectItem>
                      <SelectItem value="clinic">의원</SelectItem>
                      <SelectItem value="pharmacy">약국</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>진료과</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="예: 순환기내과" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 2. 전략적 분류 (핵심) */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            전략적 분류
          </h3>

          <FormField
            control={form.control}
            name="tier"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>중요도 등급 (Tier)</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    {[
                      {
                        val: "S",
                        label: "S (핵심)",
                        desc: "매출 50% 이상 점유",
                        color:
                          "bg-indigo-100 text-indigo-700 border-indigo-200",
                      },
                      {
                        val: "A",
                        label: "A (주력)",
                        desc: "성장 가능성 높음",
                        color: "bg-blue-50 text-blue-700 border-blue-200",
                      },
                      {
                        val: "B",
                        label: "B (일반)",
                        desc: "유지 관리",
                        color: "bg-gray-50 text-gray-700 border-gray-200",
                      },
                      {
                        val: "C",
                        label: "C (잠재)",
                        desc: "신규 발굴",
                        color: "bg-slate-50 text-slate-500 border-slate-200",
                      },
                    ].map((item) => (
                      <FormItem
                        key={item.val}
                        className="flex items-center space-x-0 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem
                            value={item.val}
                            className="peer sr-only"
                          />
                        </FormControl>
                        <FormLabel
                          className={`
                          flex flex-col items-center justify-center w-24 p-2 rounded-lg border-2 cursor-pointer transition-all
                          hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary
                          ${item.color}
                        `}
                        >
                          <span className="text-lg font-bold">{item.val}</span>
                          <span className="text-xs opacity-70">
                            {item.desc}
                          </span>
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 3. 상세 정보 */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            상세 정보
          </h3>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>주소</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>전략 메모</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="영업 전략이나 특이사항을 기록하세요."
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
