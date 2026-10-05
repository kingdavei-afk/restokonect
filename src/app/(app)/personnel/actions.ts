"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

async function requireUser(perm: Permission = "personnel") {
  const user = await getSessionUser();
  if (!user) throw new Error("Session expirée");
  if (!can(user, perm)) throw new Error("Non autorisé");
  return user;
}

export async function addEmployeeAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "SERVEUR");
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const salaryRaw = String(formData.get("monthlySalary") ?? "").trim();
  const monthlySalary = salaryRaw ? parseInt(salaryRaw, 10) : null;
  if (!name) return;

  await prisma.employee.create({
    data: {
      restaurantId: user.restaurantId,
      name,
      role,
      phone,
      monthlySalary:
        monthlySalary && !Number.isNaN(monthlySalary) ? monthlySalary : null,
    },
  });

  revalidatePath("/personnel");
}

export async function toggleEmployeeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const employee = await prisma.employee.findFirst({
    where: { id, restaurantId: user.restaurantId },
  });
  if (!employee) return;

  await prisma.employee.update({
    where: { id: employee.id },
    data: { active: !employee.active },
  });
  revalidatePath("/personnel");
}

export async function deleteEmployeeAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.employee.deleteMany({
    where: { id, restaurantId: user.restaurantId },
  });
  revalidatePath("/personnel");
}

// Pointage : démarre ou termine la journée d'un employé
export async function clockAction(formData: FormData) {
  const user = await requireUser();
  const employeeId = String(formData.get("employeeId") ?? "");
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, restaurantId: user.restaurantId },
  });
  if (!employee) return;

  const open = await prisma.timeEntry.findFirst({
    where: { employeeId: employee.id, clockOut: null },
  });

  if (open) {
    await prisma.timeEntry.update({
      where: { id: open.id },
      data: { clockOut: new Date() },
    });
  } else {
    await prisma.timeEntry.create({
      data: { employeeId: employee.id },
    });
  }

  revalidatePath("/personnel");
}